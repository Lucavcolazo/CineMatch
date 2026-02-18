import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTitleDetails, getWatchProviders, type MediaType } from "@/lib/tmdb";
import { getTitleFullInfo, searchTitlesByQuery } from "@/lib/ai/movieTools";
import { wikipediaSearch, wikipediaSummary } from "@/lib/ai/wikipediaTools";
import {
  streamText,
  convertToModelMessages,
  type UIMessage,
} from "ai";
import { gateway, stepCountIs, tool } from "ai";
import { z } from "zod";

type ChatIntent = "recommendations" | "title_info" | "history" | "other";

function detectIntent(text: string): ChatIntent {
  const t = text.toLowerCase();

  // Historial / vistas
  if (
    /\b(vistas?|visto|vi|he visto|que vi|qué vi|mi lista|mi historial)\b/.test(t)
  ) {
    return "history";
  }

  // Recomendaciones / sugerencias
  if (
    /\b(recomend|recomenda|recomiéndame|recomendame|suger|que puedo ver|qué puedo ver|que miro|qué miro)\b/.test(
      t
    )
  ) {
    return "recommendations";
  }

  // Preguntas sobre un título (aproximación simple)
  if (/\b(hablame|háblame|opinas|opinás|explica|explicame|debat|compar|final|actor|reparto|sinopsis)\b/.test(t)) {
    return "title_info";
  }

  // Fuera de dominio o general
  return "other";
}

/**
 * Extrae el texto de un UIMessage (partes tipo "text").
 */
function getMessageText(message: UIMessage): string {
  if (!message.parts?.length) return "";
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

/**
 * POST /api/chat
 * Chat con Chaty. Body: { chatId?: string, messages: UIMessage[] }.
 * Persiste mensajes en chat_messages y opcionalmente crea chat si no hay chatId.
 * Requiere sesión.
 */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "No autenticado" }), {
      status: 401,
    });
  }

  let body: { chatId?: string; messages?: UIMessage[] };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Body inválido" }), {
      status: 400,
    });
  }

  const { chatId: bodyChatId, messages: uiMessages } = body;
  const messages = Array.isArray(uiMessages) ? uiMessages : [];

  let chatId = typeof bodyChatId === "string" ? bodyChatId : undefined;

  if (!chatId) {
    const { data: newChat, error: createError } = await supabase
      .from("chats")
      .insert({ user_id: user.id, title: "Chat nuevo" })
      .select("id")
      .single();
    if (createError || !newChat) {
      return new Response(
        JSON.stringify({ error: createError?.message ?? "Error al crear chat" }),
        { status: 500 }
      );
    }
    chatId = newChat.id;
  } else {
    const { data: existing } = await supabase
      .from("chats")
      .select("id")
      .eq("id", chatId)
      .eq("user_id", user.id)
      .single();
    if (!existing) {
      return new Response(JSON.stringify({ error: "Chat no encontrado" }), {
        status: 404,
      });
    }
  }

  const lastMessage = messages[messages.length - 1];
  const isUserMessage =
    lastMessage?.role === "user" && getMessageText(lastMessage).trim().length > 0;
  const lastUserText = isUserMessage ? getMessageText(lastMessage).trim() : "";
  const intent = detectIntent(lastUserText);

  if (isUserMessage) {
    const userContent = getMessageText(lastMessage).trim();
    await supabase.from("chat_messages").insert({
      chat_id: chatId,
      role: "user",
      content: userContent,
    });

    const { count } = await supabase
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("chat_id", chatId)
      .eq("role", "user");
    if (count === 1) {
      const title =
        userContent.length > 50 ? `${userContent.slice(0, 47)}...` : userContent;
      await supabase.from("chats").update({ title }).eq("id", chatId);
    }
  }

  const { data: watchedRows } = await supabase
    .from("watched")
    .select("tmdb_id, media_type")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  const watchedCount = watchedRows?.length ?? 0;
  const watchedKeySet = new Set(
    (watchedRows ?? []).map((r) => `${r.media_type}-${r.tmdb_id}`)
  );
  let watchedContext: string;
  if (watchedCount === 0) {
    watchedContext =
      "El usuario aún no marcó títulos como vistos en CineMatch. Usá la conversación y las herramientas de búsqueda para recomendar. Si falta información (géneros, tono, época, plataforma), hacé 1-2 preguntas rápidas antes de recomendar.";
  } else {
    const slice = watchedRows!.slice(0, 25);
    const detailsRes = await Promise.allSettled(
      slice.map((row) => getTitleDetails(row.media_type as MediaType, row.tmdb_id))
    );
    // Proveedores de streaming (Argentina) solo para los primeros 5 títulos para no saturar la API
    const providerRes = await Promise.allSettled(
      slice.slice(0, 5).map((row) =>
        getWatchProviders(row.media_type as MediaType, row.tmdb_id)
      )
    );

    const titleLines: string[] = [];
    for (let i = 0; i < detailsRes.length; i++) {
      const r = detailsRes[i];
      if (r.status !== "fulfilled" || !r.value) continue;
      const d = r.value;
      const name = d.title ?? d.name ?? "";
      if (!name) continue;

      const tipo = slice[i].media_type === "movie" ? "película" : "serie";
      const year = (d.release_date ?? d.first_air_date ?? "").slice(0, 4);
      const genres = (d.genres ?? []).slice(0, 3).map((g) => g.name).join(", ");
      let extra = "";
      if (slice[i].media_type === "movie" && d.runtime) {
        extra = `, ${d.runtime} min`;
      } else if (slice[i].media_type === "tv") {
        const parts: string[] = [];
        if (d.number_of_seasons) parts.push(`${d.number_of_seasons} temp.`);
        if (d.episode_run_time?.[0]) parts.push(`${d.episode_run_time[0]} min/ep`);
        if (parts.length) extra = ", " + parts.join(", ");
      }
      let where = "";
      const prov = i < providerRes.length ? providerRes[i] : null;
      if (prov?.status === "fulfilled" && prov.value?.results?.AR?.flatrate?.length) {
        where = prov.value.results.AR.flatrate.map((p: { provider_name: string }) => p.provider_name).join(", ");
      }
      const line = where
        ? `${name} (${tipo}${year ? `, ${year}` : ""}${extra}${genres ? `, ${genres}` : ""}; ver en: ${where})`
        : `${name} (${tipo}${year ? `, ${year}` : ""}${extra}${genres ? `, ${genres}` : ""})`;
      titleLines.push(line);
    }

    const listText =
      titleLines.length > 0
        ? `Tenés acceso a la lista de títulos que el usuario marcó como vistos en CineMatch (esto es su HISTORIAL, no una lista de recomendaciones). Contiene datos de la API (año, duración, géneros y dónde ver en Argentina cuando esté disponible). Lista: ${titleLines.join("; ")}. Usala para inferir gustos y para evitar recomendar títulos ya vistos. Si el usuario pide “recomendaciones”, combiná esta señal con búsquedas externas (tools) para encontrar títulos nuevos que se ajusten a lo que pide.`
        : `El usuario tiene ${watchedCount} título(s) marcado(s) como vistos. Usalo como señal de gustos y para evitar recomendar títulos ya vistos.`;
    watchedContext = listText;
  }

  const systemPrompt = `Sos Chaty, el asistente de recomendaciones de películas y series de CineMatch. Hablás en español de forma natural y cercana.

ESTILO DE RESPUESTA:
- Escribí en texto plano, sin usar formato Markdown (no uses **negritas**, ni guiones "-", ni listas con "*", ni títulos con "#").
- Si querés enumerar recomendaciones, usá un formato simple como:
  1) Título (año, tipo). Motivo corto...
  2) Otro título (año, tipo). Motivo corto...
  (sin guiones ni asteriscos).

RESTRICCIÓN IMPORTANTE: Solo podés hablar y responder sobre temas relacionados con CineMatch: películas, series, recomendaciones, géneros, actores/actrices de cine y TV, estrenos, gustos cinematográficos, listas de títulos, etc. Si el usuario escribe sobre otro tema (deportes, política, matemáticas, clima, noticias generales, etc.), respondé una sola vez de forma amable que solo podés ayudar con películas y series, y sugerile que pregunte algo sobre recomendaciones o su lista de vistas. No des información ni mantengas conversación sobre temas ajenos a cine y series.

${watchedContext}

CAPACIDADES Y COMPORTAMIENTO (importante):
- Detectá la intención del usuario: (a) recomendaciones, (b) debate/preguntas sobre un título, (c) “qué vi / mi historial”.
- Para RECOMENDACIONES: no te bases solo en lo visto. Usá la lista de vistos como señal de gustos y como filtro (evitá recomendar cosas ya vistas). Usá las herramientas de búsqueda para encontrar títulos que coincidan con lo que el usuario pide (género, tono, época, similar a X, etc.). Si la consigna es ambigua, hacé 1-2 preguntas aclaratorias.
- Para DEBATE o PREGUNTAS sobre una película/serie: usá herramientas para obtener datos (sinopsis, ficha, dónde ver, etc.) y luego respondé con análisis propio. Si hay ambigüedad en el título, pedí aclaración o proponé 2 opciones.
- Para HISTORIAL: usá solo la lista de vistos proporcionada.

REGLA PARA RECOMENDACIONES (obligatoria): antes de recomendar, usá la herramienta searchTitlesByQuery para traer opciones externas y elegí títulos NO vistos (isWatched=false). Si necesitás enriquecer con datos (duración, providers, etc.), usá getTitleFullInfo.

FORMATO SUGERIDO:
- Si recomendás, devolvé 3-6 opciones con: título + año + tipo (película o serie, escrito en minúsculas) + 1-2 razones concretas. Si sabés dónde ver, agregalo en la misma línea al final ("Dónde ver: ...").

Respondé siempre en español. Si el usuario escribe con errores o de forma informal, entendelo igual y respondé con buena onda.`;

  // Contexto externo precomputado para ayudar al modelo a no inventar.
  // Nota: esto no reemplaza tools; es una “guía” inicial con resultados reales.
  let externalCandidatesContext = "";
  if (intent === "recommendations" || intent === "title_info") {
    try {
      const candidates = await searchTitlesByQuery({
        query: lastUserText,
        limit: 12,
      });
      const filtered =
        intent === "recommendations"
          ? candidates.filter(
              (c) => !watchedKeySet.has(`${c.mediaType}-${c.tmdbId}`)
            )
          : candidates;

      if (filtered.length) {
        const lines = filtered.slice(0, 12).map((c) => {
          const year = c.year ? `, ${c.year}` : "";
          const type = c.mediaType === "movie" ? "película" : "serie";
          return `- ${c.title} (${type}${year}) [tmdb:${c.mediaType}:${c.tmdbId}]`;
        });
        externalCandidatesContext = `\n\nCANDIDATOS_EXTERNOS_REAL (TMDB, no inventar títulos fuera de esta lista):\n${lines.join(
          "\n"
        )}\n`;
      } else {
        externalCandidatesContext =
          "\n\nCANDIDATOS_EXTERNOS_REAL: (vacío). Si necesitás títulos para recomendar o debatir, pedí una aclaración corta (por ejemplo, título exacto o género/época) y luego usá tools.\n";
      }
    } catch {
      externalCandidatesContext =
        "\n\nCANDIDATOS_EXTERNOS_REAL: (no disponibles por un error). Usá tools igualmente y, si falla, pedí una aclaración corta.\n";
    }
  }

  // Modelo barato para pruebas; override con AI_GATEWAY_CHAT_MODEL (ej. anthropic/claude-sonnet-4).
  const modelId = process.env.AI_GATEWAY_CHAT_MODEL ?? "openai/gpt-4o-mini";
  const result = streamText({
    model: gateway(modelId),
    system: systemPrompt + externalCandidatesContext,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(6),
    prepareStep: async ({ stepNumber }) => {
      if (stepNumber !== 0) return;

      if (intent === "recommendations") {
        return {
          toolChoice: { type: "tool", toolName: "searchTitlesByQuery" },
          activeTools: ["searchTitlesByQuery", "getTitleFullInfo"],
        };
      }

      if (intent === "title_info") {
        return {
          toolChoice: "required",
          activeTools: [
            "searchTitlesByQuery",
            "getTitleFullInfo",
            "wikipediaSearch",
            "wikipediaSummary",
          ],
        };
      }
    },
    tools: {
      searchTitlesByQuery: tool({
        description:
          "Busca películas y series en TMDB según una consulta en español (por ejemplo: 'thriller psicológico 2010s', 'comedias románticas', 'similar a Interstellar'). Devuelve candidatos con tipo, año y resumen corto.",
        inputSchema: z.object({
          query: z.string().min(1),
          limit: z.number().int().min(1).max(10).optional(),
        }),
        execute: async ({ query, limit }: { query: string; limit?: number }) => {
          const results = await searchTitlesByQuery({ query, limit });
          return results.map((r) => ({
            ...r,
            isWatched: watchedKeySet.has(`${r.mediaType}-${r.tmdbId}`),
          }));
        },
      }),
      getTitleFullInfo: tool({
        description:
          "Devuelve ficha completa (datos + providers) de un título de TMDB dado su mediaType ('movie'|'tv') y tmdbId. Útil para debatir o enriquecer recomendaciones con datos concretos.",
        inputSchema: z.object({
          mediaType: z.enum(["movie", "tv"]),
          tmdbId: z.number().int().positive(),
          region: z.string().min(2).max(2).optional(),
        }),
        execute: async ({
          mediaType,
          tmdbId,
          region,
        }: {
          mediaType: "movie" | "tv";
          tmdbId: number;
          region?: string;
        }) => {
          const info = await getTitleFullInfo({
            mediaType: mediaType as MediaType,
            tmdbId,
            region: region ?? "AR",
          });
          return {
            ...info,
            isWatched: watchedKeySet.has(`${mediaType}-${tmdbId}`),
          };
        },
      }),
      wikipediaSearch: tool({
        description:
          "Busca páginas en Wikipedia (español) para obtener contexto general sobre una película/serie o temas relacionados (premios, producción, recepción).",
        inputSchema: z.object({
          query: z.string().min(1),
          limit: z.number().int().min(1).max(10).optional(),
        }),
        execute: async ({ query, limit }: { query: string; limit?: number }) => {
          return wikipediaSearch({ query, limit });
        },
      }),
      wikipediaSummary: tool({
        description:
          "Obtiene el resumen de una página de Wikipedia (español) por título. Útil cuando se necesita contexto adicional que no está en TMDB.",
        inputSchema: z.object({
          title: z.string().min(1),
        }),
        execute: async ({ title }: { title: string }) => {
          return wikipediaSummary({ title });
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse({
    headers: {
      "X-Chat-Id": chatId as string,
    },
    onFinish: async ({ responseMessage }) => {
      const text = getMessageText(responseMessage as UIMessage);
      if (text.trim()) {
        await supabase.from("chat_messages").insert({
          chat_id: chatId,
          role: "assistant",
          content: text.trim(),
        });
      }
    },
  });
}
