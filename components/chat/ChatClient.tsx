"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import * as LucideIcons from "lucide-react";
import { ChevronLeft, ChevronRight, MessageCircle, Menu, Plus, Popcorn, User, MoreVertical, Edit2, Trash2, Check, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ChatInput } from "./ChatInput";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type ChatListItem = { id: string; title: string | null; created_at: string; updated_at?: string };

type UserProfile = {
  display_name: string | null;
  avatar_url: string | null;
  avatar_icon: string | null;
  avatar_color: string | null;
} | null;

const AVATAR_ICON_MAP: Record<string, LucideIcon> = {
  User: LucideIcons.User,
  UserCircle: LucideIcons.UserCircle,
  UserRound: LucideIcons.UserRound,
  Bot: LucideIcons.Bot,
  Ghost: LucideIcons.Ghost,
  Heart: LucideIcons.Heart,
  Star: LucideIcons.Star,
  Film: LucideIcons.Film,
  Tv: LucideIcons.Tv,
  Music: LucideIcons.Music,
  Camera: LucideIcons.Camera,
  Coffee: LucideIcons.Coffee,
  Gamepad2: LucideIcons.Gamepad2,
  BookOpen: LucideIcons.BookOpen,
  Palette: LucideIcons.Palette,
  Smile: LucideIcons.Smile,
  Cat: LucideIcons.Cat,
  Dog: LucideIcons.Dog,
};

function getAvatarIconComponent(iconName: string | null): LucideIcon {
  if (iconName && iconName in AVATAR_ICON_MAP) return AVATAR_ICON_MAP[iconName];
  return User;
}

function apiMessageToUIMessage(m: { id: string; role: string; content: string }): UIMessage {
  return {
    id: m.id,
    role: m.role as "user" | "assistant" | "system",
    parts: [{ type: "text", text: m.content }],
  };
}

export function ChatClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatIdFromUrl = searchParams.get("chatId") ?? undefined;

  const [chatId, setChatId] = useState<string | undefined>(chatIdFromUrl);
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [loadedMessages, setLoadedMessages] = useState<UIMessage[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(!!chatIdFromUrl);
  const [userProfile, setUserProfile] = useState<UserProfile>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const chatIdRef = useRef(chatId);
  const prevLoadingRef = useRef(loadingMessages);

  // Chat Actions State
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const loadUserProfile = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserEmail(user.email ?? "");
    const { data } = await supabase
      .from("profiles")
      .select("display_name, avatar_url, avatar_icon, avatar_color")
      .eq("id", user.id)
      .single();
    setUserProfile(data ?? null);
  }, []);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  useEffect(() => {
    const onProfileUpdated = () => loadUserProfile();
    window.addEventListener("profile-updated", onProfileUpdated);
    return () => window.removeEventListener("profile-updated", onProfileUpdated);
  }, [loadUserProfile]);

  const userDisplayName =
    (userProfile?.display_name?.trim() && userProfile.display_name) ||
    (userEmail && userEmail.split("@")[0]) ||
    "Vos";
  const UserAvatarIcon = getAvatarIconComponent(userProfile?.avatar_icon ?? null);
  const userAvatarColor = userProfile?.avatar_color || "#6366f1";

  useEffect(() => {
    chatIdRef.current = chatId;
  }, [chatId]);

  useEffect(() => {
    setChatId(chatIdFromUrl ?? undefined);
  }, [chatIdFromUrl]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const fetchChats = useCallback(async () => {
    setLoadingChats(true);
    try {
      const res = await fetch("/api/chats");
      if (!res.ok) return;
      const data = await res.json();
      setChats(data.chats ?? []);
    } finally {
      setLoadingChats(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const fetchMessages = useCallback(async (id: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/chats/${id}/messages`);
      if (!res.ok) {
        setLoadedMessages([]);
        return;
      }
      const data = await res.json();
      const msgs = (data.messages ?? []).map(apiMessageToUIMessage);
      setLoadedMessages(msgs);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (chatId) {
      setLoadedMessages([]);
      fetchMessages(chatId);
    } else {
      setLoadedMessages([]);
      setLoadingMessages(false);
    }
  }, [chatId, fetchMessages]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({ chatId: chatIdRef.current }),
        fetch: async (input, init) => {
          const res = await fetch(input as string, init);
          const newId = res.headers.get("X-Chat-Id");
          if (newId && !chatIdRef.current) {
            setChatId(newId);
            router.replace(`/chat?chatId=${newId}`);
          }
          return res;
        },
      }),
    [router]
  );

  const { messages: chatMessages, sendMessage, status, setMessages } = useChat({
    id: chatId ?? "new",
    transport,
    messages: loadedMessages,
  });

  useEffect(() => {
    if (prevLoadingRef.current && !loadingMessages && chatId && loadedMessages.length >= 0) {
      setMessages(loadedMessages);
    }
    prevLoadingRef.current = loadingMessages;
  }, [loadingMessages, chatId, loadedMessages, setMessages]);

  const handleNewChat = async () => {
    try {
      const res = await fetch("/api/chats", { method: "POST" });
      if (!res.ok) return;
      const data = await res.json();
      const id = data.id;
      if (id) {
        router.push(`/chat?chatId=${id}`);
        setChatId(id);
        fetchChats();
      }
    } catch {
      // ignore
    }
  };

  const handleDeleteChat = async (id: string) => {
    // Instant delete, no confirmation
    try {
      // Optimistic delete from UI first
      setChats((prev) => prev.filter((c) => c.id !== id));
      if (chatId === id) {
        setChatId(undefined);
        router.replace("/chat");
      }

      const res = await fetch(`/api/chats/${id}`, { method: "DELETE" });
      if (!res.ok) {
        // If failed, maybe revert? integrating fetchChats() would be safer but user wants speed.
        console.error("Failed to delete chat in DB");
        fetchChats(); // Revert/Sync if error
      }
    } catch (error) {
      console.error("Failed to delete chat", error);
    }
  };

  const startEditing = (id: string, currentTitle: string | null) => {
    setEditingChatId(id);
    setEditingTitle(currentTitle || "Chat nuevo");
    setContextMenu(null);
  };

  const saveTitle = async () => {
    if (!editingChatId) return;
    const newTitle = editingTitle.trim() || "Chat nuevo";
    
    // Optimistic update
    setChats((prev) => prev.map(c => c.id === editingChatId ? { ...c, title: newTitle } : c));
    setEditingChatId(null);

    try {
      await fetch(`/api/chats/${editingChatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
    } catch (error) {
      console.error("Failed to rename chat", error);
      fetchChats(); // Revert on error
    }
  };

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setContextMenu({ id, x: e.clientX, y: e.clientY });
  };

  const onMenuButtonClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    // Position menu slightly offset from the button
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setContextMenu({ id, x: rect.right + 5, y: rect.top });
  };

  // Long Press Handlers
  const handleTouchStart = (id: string, e: React.TouchEvent) => {
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    longPressTimerRef.current = setTimeout(() => {
      setContextMenu({ id, x, y });
    }, 600); // 600ms long press
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const [inputValue, setInputValue] = useState("");
  const isLoading = status === "submitted" || status === "streaming";
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileChatsOpen, setMobileChatsOpen] = useState(false);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    if (chatId && (chatMessages.length > 0 || isLoading)) {
      scrollToBottom(isLoading ? "auto" : "smooth");
    }
  }, [chatId, chatMessages, isLoading, scrollToBottom]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(e.target as Node)) {
        setMobileChatsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = useCallback(() => {
    const text = inputValue.trim();
    if (!text || isLoading) return;
    sendMessage({ text });
    setInputValue("");
  }, [inputValue, isLoading, sendMessage]);

  const displayMessages = chatMessages;

  const selectChat = (id: string) => {
    router.push(`/chat?chatId=${id}`);
    setChatId(id);
    setMobileChatsOpen(false);
  };

  const sidebarContent = (
    <>
      <div className="flex-1 overflow-y-auto p-2 min-h-0 border-b border-white/10">
        <p className="px-2 py-1 text-xs font-medium text-white/50 uppercase tracking-wider">
          Tus chats
        </p>
        {loadingChats ? (
          <p className="px-2 py-2 text-sm text-white/50">Cargando...</p>
        ) : chats.length === 0 ? (
          <p className="px-2 py-2 text-sm text-white/50">Ningún chat aún</p>
        ) : (
          <ul className="space-y-0.5">
            {chats.map((c) => (
              <li key={c.id} className="relative group">
                 {editingChatId === c.id ? (
                    <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-lg">
                      <input
                        autoFocus
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveTitle();
                          if (e.key === "Escape") setEditingChatId(null);
                        }}
                        className="flex-1 bg-transparent text-white text-sm outline-none w-full min-w-0"
                      />
                      <button onClick={saveTitle} className="p-1 hover:text-green-400 text-white/50"><Check className="h-3 w-3" /></button>
                      <button onClick={() => setEditingChatId(null)} className="p-1 hover:text-red-400 text-white/50"><X className="h-3 w-3" /></button>
                    </div>
                  ) : (
                  <button
                    type="button"
                    onClick={() => selectChat(c.id)}
                    onTouchStart={(e) => handleTouchStart(c.id, e)}
                    onTouchEnd={handleTouchEnd}
                    onTouchMove={handleTouchEnd} /* Cancel if moved */
                    className={cn(
                      "w-full text-left rounded-lg px-3 py-2 text-sm truncate transition-colors relative pr-9", // Added padding right for button
                      chatId === c.id
                        ? "bg-white/15 text-white"
                        : "text-white/80 hover:bg-white/10"
                    )}
                  >
                    {c.title || "Chat nuevo"}
                    {/* Three Dots Button (Left Click Menu) */}
                    <div 
                        className="absolute right-0 top-0 bottom-0 w-9 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => onMenuButtonClick(e, c.id)}
                    >
                        <MoreVertical className="h-3.5 w-3.5 text-white/50 hover:text-white" />
                    </div>
                  </button>
                  )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="p-3 shrink-0">
        <button
          type="button"
          onClick={handleNewChat}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-white/90 hover:bg-white/10 transition-colors"
        >
          <Plus className="h-4 w-4 shrink-0" />
          Nuevo chat
        </button>
      </div>
      
      {/* Context Menu Overlay */}
      {contextMenu && (
        <div 
          className="fixed z-50 bg-[#1e1e1e] border border-white/10 rounded-lg shadow-xl py-1 min-w-[140px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={() => startEditing(contextMenu.id, chats.find(c => c.id === contextMenu.id)?.title ?? null)}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5" /> Renombrar
          </button>
          <button 
            onClick={() => { handleDeleteChat(contextMenu.id); setContextMenu(null); }}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-white/10 hover:text-red-300 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" /> Eliminar
          </button>
        </div>
      )}
    </>
  );

  return (
    <div className="flex h-full bg-black text-white relative">
      {/* Desktop: sidebar colapsable */}
      <aside
        className={cn(
          "hidden sm:flex flex-col border-r border-white/10 bg-black/50 shrink-0 transition-[width] duration-200 overflow-hidden",
          sidebarOpen ? "w-56 lg:w-64" : "w-0 min-w-0 border-r-0 p-0"
        )}
      >
        {sidebarOpen ? sidebarContent : null}
      </aside>

      {/* Desktop: pestaña a la mitad del borde con flechita (abrir/cerrar sidebar) */}
      <button
        type="button"
        onClick={() => setSidebarOpen((o) => !o)}
        className={cn(
          "hidden sm:flex absolute top-1/2 -translate-y-1/2 z-10 w-6 py-3 rounded-r-md bg-white/10 text-white/80 hover:bg-white/15 hover:text-white border border-l-0 border-white/10 items-center justify-center transition-[left] duration-200",
          sidebarOpen ? "left-56 lg:left-64" : "left-0"
        )}
        aria-label={sidebarOpen ? "Cerrar lista de chats" : "Abrir lista de chats"}
      >
        {sidebarOpen ? (
          <ChevronLeft className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        )}
      </button>

      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Móvil: barra con desplegable de chats */}
        <div ref={mobileDropdownRef} className="sm:hidden relative shrink-0 border-b border-white/10">
          <div className="flex items-center justify-between px-3 py-2">
            <button
              type="button"
              onClick={() => setMobileChatsOpen((o) => !o)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/10 transition-colors"
            >
              <Menu className="h-5 w-5 shrink-0" />
              Tus chats
            </button>
          </div>
          {mobileChatsOpen && (
            <div className="absolute left-0 right-0 top-full z-20 max-h-[70vh] overflow-y-auto border-b border-white/10 bg-black shadow-lg sm:hidden">
                {/* Mobile version reuses sidebarContent in a simplified way? 
                    Actually, copying standard list is safer to separate mobile specifics if needed, 
                    but sidebarContent uses standard hooks. Let's just use a modified version for mobile or same?
                    The current sidebarContent has mouse events. Touch events work on mobile.
                    Let's assume the user wants the SAME interactions (long press) in mobile menu.
                */}
              <div className="p-2 flex flex-col">
                <p className="px-2 py-1.5 text-xs font-medium text-white/50 uppercase tracking-wider">
                  Chats recientes
                </p>
                {loadingChats ? (
                  <p className="px-2 py-2 text-sm text-white/50">Cargando...</p>
                ) : chats.length === 0 ? (
                  <p className="px-2 py-2 text-sm text-white/50">Ningún chat aún</p>
                ) : (
                  <ul className="space-y-0.5 flex-1 min-h-0 overflow-y-auto">
                    {chats.map((c) => (
                      <li key={c.id} className="relative group">
                          {editingChatId === c.id ? (
                            <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-lg">
                                <input
                                    autoFocus
                                    value={editingTitle}
                                    onChange={(e) => setEditingTitle(e.target.value)}
                                    className="flex-1 bg-transparent text-white text-sm outline-none w-full min-w-0"
                                />
                                <button onClick={saveTitle} className="p-1 hover:text-green-400 text-white/50"><Check className="h-3 w-3" /></button>
                                <button onClick={() => setEditingChatId(null)} className="p-1 hover:text-red-400 text-white/50"><X className="h-3 w-3" /></button>
                            </div>
                          ) : (
                          <button
                            type="button"
                            onClick={() => selectChat(c.id)}
                            onTouchStart={(e) => handleTouchStart(c.id, e)}
                            onTouchEnd={handleTouchEnd}
                            onTouchMove={handleTouchEnd}
                            className={cn(
                              "w-full text-left rounded-lg px-3 py-2 text-sm truncate transition-colors select-none", 
                              chatId === c.id
                                ? "bg-white/15 text-white"
                                : "text-white/80 hover:bg-white/10"
                            )}
                          >
                            {c.title || "Chat nuevo"}
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  onClick={() => {
                    handleNewChat();
                    setMobileChatsOpen(false);
                  }}
                  className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-white/90 hover:bg-white/10 transition-colors shrink-0"
                >
                  <Plus className="h-4 w-4 shrink-0" />
                  Nuevo chat
                </button>
              </div>
            </div>
          )}
        </div>

        {!chatId ? (
          <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
            <MessageCircle className="h-12 w-12 text-white/30 mb-4" />
            <p className="text-white/80 mb-2">Seleccioná un chat o creá uno nuevo</p>
            <button
              type="button"
              onClick={handleNewChat}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nuevo chat
            </button>
          </div>
        ) : (
          <>
            <div
              className={cn(
                "flex-1 overflow-y-auto px-4 py-6 transition-[padding] duration-200",
                !sidebarOpen && "sm:pl-10"
              )}
            >
              {loadingMessages ? (
                <p className="text-white/50 text-sm">Cargando conversación...</p>
              ) : displayMessages.length === 0 && !isLoading ? (
                <p className="text-white/50 text-sm">No hay mensajes en este chat.</p>
              ) : (
                <div className="max-w-2xl mx-auto space-y-6">
                  {displayMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "rounded-xl px-4 py-3",
                        msg.role === "user"
                          ? "ml-auto max-w-[85%] bg-white/10 text-white"
                          : "mr-auto max-w-[85%] bg-white/5 text-white/90 border border-white/10"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {msg.role === "user" ? (
                          userProfile?.avatar_url ? (
                            <img
                              src={userProfile.avatar_url}
                              alt=""
                              className="h-6 w-6 shrink-0 rounded-full object-cover ring-1 ring-white/20"
                            />
                          ) : (
                            <span
                              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white/90"
                              style={{ backgroundColor: userAvatarColor }}
                            >
                              <UserAvatarIcon className="h-3.5 w-3.5" />
                            </span>
                          )
                        ) : (
                          <Popcorn className="h-4 w-4 shrink-0 text-white/70" />
                        )}
                        <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
                          {msg.role === "user" ? userDisplayName : "Chaty"}
                        </span>
                      </div>
                      {msg.parts.map((part, i) =>
                        part.type === "text" ? (
                          <p key={`${msg.id}-${i}`} className="whitespace-pre-wrap text-sm">
                            {part.text}
                          </p>
                        ) : null
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="mr-auto max-w-[85%] rounded-xl px-4 py-3 bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Popcorn className="h-4 w-4 shrink-0 text-white/70" />
                        <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
                          Chaty
                        </span>
                      </div>
                      <span className="chat-thinking-shine inline-block text-sm font-medium">
                        Pensando...
                      </span>
                    </div>
                  )}
                  <div ref={messagesEndRef} aria-hidden="true" />
                </div>
              )}
            </div>
            <div
              className={cn(
                "border-t border-white/10 p-4 transition-[padding] duration-200",
                !sidebarOpen && "sm:pl-10"
              )}
            >
              <ChatInput
                value={inputValue}
                onChange={setInputValue}
                onSubmit={handleSubmit}
                disabled={isLoading}
                placeholder="Escribí tu mensaje..."
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
