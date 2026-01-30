import { ChatClient } from "@/components/chat/ChatClient";
import { Footer } from "@/components/Footer";

export const dynamic = "force-dynamic";

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-black text-white pt-[132px] lg:pt-[57px] flex flex-col">
      <div className="h-[calc(100vh-132px)] lg:h-[calc(100vh-57px)] flex-1 min-h-0">
        <ChatClient />
      </div>
      <Footer />
    </div>
  );
}
