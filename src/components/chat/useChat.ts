import { useCallback, useRef, useState } from "react";

import type { Helpline, LegalAidOffice } from "@/data/types";
import { ask, AbortError, type AskEvent } from "@/lib/assistant/engine";
import type { AnswerCard, Classification, RankedSource, UserProfile } from "@/lib/assistant/types";
import type { Locale } from "@/lib/i18n/config";

// ── Message types ──

export type ChatPhase = "idle" | "thinking" | "retrieving" | "streaming" | "done";

export type UserMessage = {
  role: "user";
  id: string;
  text: string;
  timestamp: number;
};

export type AssistantMessage = {
  role: "assistant";
  id: string;
  timestamp: number;
  /** Current generation phase — drives the status indicator. */
  phase: ChatPhase;
  /** The streamed lead-in text assembled so far. */
  streamedText: string;
  /** Triage result (available after thinking). */
  classification: Classification | null;
  /** Retrieved sources (normal path only). */
  sources: RankedSource[];
  /** The final answer card. */
  card: AnswerCard | null;
  /** Emergency helplines (red/minor path). */
  helplines: Helpline[] | null;
  helplineReason: "red" | "minor" | null;
  /** Legal aid offices. */
  legalAid: LegalAidOffice[];
};

export type ChatMessage = UserMessage | AssistantMessage;

// ── Hook ──

export type UseChatOptions = {
  locale: Locale;
  profile?: UserProfile;
};

export type UseChatReturn = {
  messages: ChatMessage[];
  phase: ChatPhase;
  send: (text: string) => void;
  abort: () => void;
  clear: () => void;
};

let messageCounter = 0;
function nextId(): string {
  messageCounter += 1;
  return `msg-${messageCounter}-${Date.now()}`;
}

function createAssistantMessage(): AssistantMessage {
  return {
    role: "assistant",
    id: nextId(),
    timestamp: Date.now(),
    phase: "thinking",
    streamedText: "",
    classification: null,
    sources: [],
    card: null,
    helplines: null,
    helplineReason: null,
    legalAid: [],
  };
}

/**
 * Manages the chat session: message history, engine streaming, and abort.
 * State is session-only — nothing persisted, no server calls.
 */
export function useChat({ locale, profile }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [phase, setPhase] = useState<ChatPhase>("idle");
  const abortRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPhase("done");
    // Mark the current assistant message as done too
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === "assistant" && last.phase !== "done") {
        return [...prev.slice(0, -1), { ...last, phase: "done" as const }];
      }
      return prev;
    });
  }, []);

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      // Abort any in-flight generation
      abortRef.current?.abort();

      const userMsg: UserMessage = {
        role: "user",
        id: nextId(),
        text: trimmed,
        timestamp: Date.now(),
      };

      const assistantMsg = createAssistantMessage();

      setMessages((prev) => {
        // If previous assistant message was interrupted, mark it done
        const cleaned = prev.map((m) =>
          m.role === "assistant" && m.phase !== "done" ? { ...m, phase: "done" as const } : m,
        );
        return [...cleaned, userMsg, assistantMsg];
      });
      setPhase("thinking");

      const controller = new AbortController();
      abortRef.current = controller;

      // Run the engine in the background
      void (async () => {
        try {
          const gen = ask(trimmed, {
            locale,
            profile,
            signal: controller.signal,
            speed: 1,
          });

          for await (const event of gen) {
            if (controller.signal.aborted) break;
            applyEvent(event, assistantMsg.id, setMessages, setPhase);
          }
        } catch (err) {
          if (err instanceof AbortError) {
            // User cancelled — not an error
          } else {
            // Unexpected error: mark done
            setPhase("done");
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last && last.id === assistantMsg.id) {
                return [...prev.slice(0, -1), { ...last, phase: "done" as const }];
              }
              return prev;
            });
          }
        }
      })();
    },
    [locale, profile],
  );

  const clear = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages([]);
    setPhase("idle");
  }, []);

  return { messages, phase, send, abort, clear };
}

/**
 * Applies a single engine event to the messages array. Each event mutates the
 * last assistant message in place (via spread) so React sees a new reference.
 */
function applyEvent(
  event: AskEvent,
  assistantId: string,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  setPhase: React.Dispatch<React.SetStateAction<ChatPhase>>,
) {
  const update = (fn: (msg: AssistantMessage) => Partial<AssistantMessage>) => {
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.id === assistantId);
      if (idx === -1) return prev;
      const msg = prev[idx] as AssistantMessage;
      const updated = { ...msg, ...fn(msg) };
      return [...prev.slice(0, idx), updated, ...prev.slice(idx + 1)];
    });
  };

  switch (event.type) {
    case "thinking":
      setPhase("thinking");
      update(() => ({ phase: "thinking" }));
      break;

    case "triage":
      update(() => ({ classification: event.classification }));
      break;

    case "retrieving":
      setPhase("retrieving");
      update(() => ({ phase: "retrieving", sources: event.sources }));
      break;

    case "token":
      setPhase("streaming");
      update((msg) => ({
        phase: "streaming",
        streamedText: msg.streamedText + event.text,
      }));
      break;

    case "card":
      update(() => ({ card: event.card }));
      break;

    case "helplines":
      update(() => ({
        helplines: event.helplines,
        helplineReason: event.reason,
      }));
      break;

    case "aid":
      update(() => ({ legalAid: event.offices }));
      break;

    case "done":
      setPhase("done");
      update(() => ({ phase: "done" }));
      break;
  }
}
