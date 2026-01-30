import { ChatClient } from "@/components/chat/ChatClient";
import { Footer } from "@/components/Footer";

export const dynamic = "force-dynamic";

export default function ChatPage() {
  return (
    <div className="h-screen bg-black text-white pt-[132px] lg:pt-[57px] flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 relative">
        <ChatClient />
      </div>
    </div>
  );
}
