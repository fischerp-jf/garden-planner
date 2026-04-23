"use client";

import { createContext, useContext, useState } from "react";

export interface ChatFocus {
  type: "planting" | "zone";
  id: string;
  label: string; // display name for the context badge
}

interface ChatFocusContextValue {
  focus: ChatFocus | null;
  setFocus: (f: ChatFocus | null) => void;
}

export const ChatFocusContext = createContext<ChatFocusContextValue>({
  focus: null,
  setFocus: () => {},
});

export function ChatFocusProvider({ children }: { children: React.ReactNode }) {
  const [focus, setFocus] = useState<ChatFocus | null>(null);
  return (
    <ChatFocusContext.Provider value={{ focus, setFocus }}>
      {children}
    </ChatFocusContext.Provider>
  );
}

export function useChatFocus() {
  return useContext(ChatFocusContext);
}
