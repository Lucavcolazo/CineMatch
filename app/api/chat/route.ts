import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTitleDetails, getWatchProviders, type MediaType } from "@/lib/tmdb";
import {
  streamText,
  convertToModelMessages,
  type UIMessage,
} from "ai";
import { gateway } from "ai";

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
  let watchedContext: string;
  if (watchedCount === 0) {
    watchedContext =
      "El usuario aún no marcó títulos como vistos en CineMatch. Recomendá en base a lo que pida en la conversación.";
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
        ? `Tenés acceso a la lista de títulos que el usuario marcó como vistos en CineMatch, con datos de la API (año, duración, géneros, dónde ver en Argentina cuando esté disponible). Lista: ${titleLines.join("; ")}. Usala siempre que pida recomendaciones o una lista; podés mencionar duración, año, géneros y dónde ver. No digas que no tenés acceso: esta lista te fue proporcionada para que la uses.`
        : `El usuario tiene ${watchedCount} título(s) marcado(s) como vistos. Tené en cuenta sus gustos al recomendar.`;
    watchedContext = listText;
  }

  const systemPrompt = `Sos Chaty, el asistente de recomendaciones de películas y series de CineMatch. Hablás en español de forma natural y cercana.

RESTRICCIÓN IMPORTANTE: Solo podés hablar y responder sobre temas relacionados con CineMatch: películas, series, recomendaciones, géneros, actores/actrices de cine y TV, estrenos, gustos cinematográficos, listas de títulos, etc. Si el usuario escribe sobre otro tema (deportes, política, matemáticas, clima, noticias generales, etc.), respondé una sola vez de forma amable que solo podés ayudar con películas y series, y sugerile que pregunte algo sobre recomendaciones o su lista de vistas. No des información ni mantengas conversación sobre temas ajenos a cine y series.

${watchedContext}
Respondé siempre en español. Si el usuario escribe con errores o de forma informal, entendelo igual y respondé con buena onda. Recomendá películas y series cuando pida sugerencias; podés mencionar títulos concretos, duración, año, géneros y dónde ver (streaming en Argentina cuando lo tengas en la lista). Si recomendás un título que no está en la lista del usuario, podés decir que en CineMatch puede ver la ficha con duración, dónde verla y más en Descubrir o en la página del título.`;

  // Modelo barato para pruebas; override con AI_GATEWAY_CHAT_MODEL (ej. anthropic/claude-sonnet-4).
  const modelId = process.env.AI_GATEWAY_CHAT_MODEL ?? "openai/gpt-4o-mini";
  const result = streamText({
    model: gateway(modelId),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
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
