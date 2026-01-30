import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/chats/[chatId]/messages
 * Devuelve los mensajes del chat. Verifica que el chat pertenezca al usuario.
 * Requiere sesión.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: chat, error: chatError } = await supabase
    .from("chats")
    .select("id")
    .eq("id", chatId)
    .eq("user_id", user.id)
    .single();

  if (chatError || !chat) {
    return NextResponse.json(
      { error: "Chat no encontrado" },
      { status: 404 }
    );
  }

  const { data: messages, error: msgError } = await supabase
    .from("chat_messages")
    .select("id, role, content, created_at")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (msgError) {
    return NextResponse.json(
      { error: msgError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ messages: messages ?? [] });
}
