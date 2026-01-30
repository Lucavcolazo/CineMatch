import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const CHATY_GREETING =
  "Hola, soy Chaty, tu asistente de películas. Contame qué querés que te recomiende hoy.";

/**
 * GET /api/chats
 * Lista los chats del usuario ordenados por updated_at desc.
 * Requiere sesión.
 */
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: chats, error } = await supabase
    .from("chats")
    .select("id, title, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: 500 }
    );
  }

  return NextResponse.json({ chats: chats ?? [] });
}

/**
 * POST /api/chats
 * Crea un chat nuevo e inserta el primer mensaje del asistente (Chaty).
 * Requiere sesión.
 */
export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: chat, error: chatError } = await supabase
    .from("chats")
    .insert({
      user_id: user.id,
      title: "Chat nuevo",
    })
    .select("id")
    .single();

  if (chatError || !chat) {
    return NextResponse.json(
      { error: chatError?.message ?? "Error al crear chat", code: chatError?.code },
      { status: 500 }
    );
  }

  const { error: msgError } = await supabase.from("chat_messages").insert({
    chat_id: chat.id,
    role: "assistant",
    content: CHATY_GREETING,
  });

  if (msgError) {
    return NextResponse.json(
      { error: msgError.message, code: msgError.code },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: chat.id });
}
