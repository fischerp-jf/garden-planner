"use client";

import { useState } from "react";
import { NavRail } from "@/components/NavRail";
import { ChatDrawer } from "@/components/ChatDrawer";
import { ChatFocusProvider } from "@/components/ChatFocusContext";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <ChatFocusProvider>
      <div className="app-layout">
        <NavRail />
        <div className="page-content">
          {children}
        </div>
        <button
          type="button"
          className="chat-toggle-btn"
          onClick={() => setChatOpen((o) => !o)}
          aria-label={chatOpen ? "Close chat" : "Open chat"}
          aria-expanded={chatOpen}
        >
          {chatOpen ? "✕" : "◎ Chat"}
        </button>
        <ChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} />
      </div>
    </ChatFocusProvider>
  );
}
