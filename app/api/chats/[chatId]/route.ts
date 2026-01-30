import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ chatId: string }> }
) {
    const { chatId } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`[DELETE] Attempting to delete chat: ${chatId} for user: ${user.id}`);

    // Verify ownership
    const { data: chat, error: fetchError } = await supabase
        .from("chats")
        .select("user_id")
        .eq("id", chatId)
        .single();

    if (fetchError || !chat) {
        console.error(`[DELETE] Chat not found or fetch error:`, fetchError);
        return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    if (chat.user_id !== user.id) {
        console.warn(`[DELETE] Unauthorized access attempt: expected ${user.id}, got ${chat.user_id}`);
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete chat
    const { error: deleteError } = await supabase
        .from("chats")
        .delete()
        .eq("id", chatId);

    if (deleteError) {
        console.error(`[DELETE] Database delete error:`, deleteError);
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    console.log(`[DELETE] Successfully deleted chat: ${chatId}`);
    return NextResponse.json({ success: true });
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ chatId: string }> }
) {
    const { chatId } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const { title } = json;

    if (typeof title !== "string" || !title.trim()) {
        return NextResponse.json({ error: "Invalid title" }, { status: 400 });
    }

    console.log(`[PATCH] Attempting to rename chat: ${chatId} to "${title}"`);

    // Verify ownership
    const { data: chat, error: fetchError } = await supabase
        .from("chats")
        .select("user_id")
        .eq("id", chatId)
        .single();

    if (fetchError || !chat) {
        console.error(`[PATCH] Chat not found or fetch error:`, fetchError);
        return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    if (chat.user_id !== user.id) {
        console.warn(`[PATCH] Unauthorized access attempt`);
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update chat
    const { error: updateError } = await supabase
        .from("chats")
        .update({ title: title.trim(), updated_at: new Date().toISOString() })
        .eq("id", chatId);

    if (updateError) {
        console.error(`[PATCH] Database update error:`, updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log(`[PATCH] Successfully renamed chat: ${chatId}`);
    return NextResponse.json({ success: true, title: title.trim() });
}
