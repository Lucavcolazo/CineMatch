import { ChatClient } from "@/components/chat/ChatClient";

export const dynamic = "force-dynamic";

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-black text-white pt-[132px] lg:pt-[57px]">
      <div className="h-[calc(100vh-132px)] lg:h-[calc(100vh-57px)]">
        <ChatClient />
      </div>
    </div>
  );
}
