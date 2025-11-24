"use client";

import AIVoiceFlow from "@/components/ZoeIA/ai-voice-flow";
import { useTheme } from "next-themes";
import React from "react";

export default function VozPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Classes condicionais para manter coerência com o chat
  const bgClass = isDark
    ? "bg-gray-900 text-white"
    : "bg-gray-50 text-gray-900";

  return (
    <div className={`min-h-screen flex items-center justify-center p-10 transition-colors ${bgClass}`}>
      <AIVoiceFlow />
    </div>
  );
}

