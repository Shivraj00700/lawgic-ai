import { Bot, User } from "lucide-react";
import { useEffect, useRef } from "react";

import { useI18n } from "@/lib/i18n/context";

import type { AssistantMessage, ChatMessage, ChatPhase } from "./useChat";

export type MessageListProps = {
  messages: ChatMessage[];
};

/**
 * Renders the chat message history with auto-scroll and an aria-live region
 * so screen readers announce new assistant content.
 */
export function MessageList({ messages }: MessageListProps) {
  const { t } = useI18n();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) return null;

  return (
    <section className="mx-auto mt-6 max-w-[660px] space-y-4" aria-label={t.chat.liveRegionLabel}>
      {/* Live region for streaming text — polite so it doesn't interrupt */}
      <div aria-live="polite" aria-atomic="false" className="sr-only">
        {messages
          .filter((m): m is AssistantMessage => m.role === "assistant")
          .map((m) => (
            <span key={m.id}>{m.streamedText}</span>
          ))}
      </div>

      {messages.map((msg) =>
        msg.role === "user" ? (
          <UserBubble key={msg.id} text={msg.text} label={t.chat.youLabel} />
        ) : (
          <AssistantBubble key={msg.id} message={msg} label={t.chat.assistantLabel} />
        ),
      )}
      <div ref={bottomRef} />
    </section>
  );
}

function UserBubble({ text, label }: { text: string; label: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
        <User className="size-4" strokeWidth={1.8} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
        <p className="rounded-2xl rounded-tl-sm bg-card px-4 py-3 text-[15px] shadow-sm ring-1 ring-border">
          {text}
        </p>
      </div>
    </div>
  );
}

function AssistantBubble({ message, label }: { message: AssistantMessage; label: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary">
        <Bot className="size-4 text-foreground/70" strokeWidth={1.8} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
        <div className="space-y-3">
          <PhaseIndicator phase={message.phase} />
          {message.streamedText && (
            <p className="rounded-2xl rounded-tl-sm bg-card px-4 py-3 text-[15px] shadow-sm ring-1 ring-border">
              {message.streamedText}
              {message.phase === "streaming" && (
                <span
                  className="ml-0.5 inline-block size-2 animate-pulse rounded-full bg-primary/60"
                  aria-hidden="true"
                />
              )}
            </p>
          )}
          {message.card && <AnswerCardPreview card={message.card} />}
          {message.helplines && (
            <HelplinesPreview helplines={message.helplines} reason={message.helplineReason} />
          )}
          {message.legalAid.length > 0 && <LegalAidPreview offices={message.legalAid} />}
        </div>
      </div>
    </div>
  );
}

function PhaseIndicator({ phase }: { phase: ChatPhase }) {
  const { t } = useI18n();
  if (phase === "idle" || phase === "done") return null;

  const label =
    phase === "thinking" ? t.chat.thinking : phase === "retrieving" ? t.chat.retrieving : null;

  if (!label) return null;

  return (
    <p className="flex items-center gap-2 text-xs text-muted-foreground">
      <span
        className="inline-block size-2 animate-pulse rounded-full bg-primary/50"
        aria-hidden="true"
      />
      {label}…
    </p>
  );
}

// ── Minimal card previews (Task 7 will build the full answer card) ──

function AnswerCardPreview({ card }: { card: import("@/lib/assistant/types").AnswerCard }) {
  const { t } = useI18n();

  if (card.lowConfidence) {
    return (
      <div className="rounded-2xl border border-border bg-card px-4 py-4 text-sm shadow-sm">
        <p className="font-medium text-muted-foreground">{t.answer.confidence.low}</p>
        <p className="mt-1 text-muted-foreground">{t.answer.lowConfidenceBody}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-4 shadow-sm">
      {card.rights.length > 0 && (
        <div className="mb-3">
          <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t.answer.rights}
          </h3>
          <ul className="space-y-1 text-sm">
            {card.rights.map((bullet, i) => (
              <li key={i} className="flex gap-2">
                <span
                  className="mt-1 block size-1.5 shrink-0 rounded-full bg-primary/60"
                  aria-hidden="true"
                />
                <span>{bullet.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {card.steps.length > 0 && (
        <div className="mb-3">
          <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t.answer.steps}
          </h3>
          <ol className="list-inside list-decimal space-y-1 text-sm">
            {card.steps.map((bullet, i) => (
              <li key={i}>{bullet.text}</li>
            ))}
          </ol>
        </div>
      )}
      {card.sources.length > 0 && (
        <div className="border-t border-border pt-3">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t.answer.source}
          </h3>
          <ul className="space-y-0.5 text-xs text-muted-foreground">
            {card.sources.map((source) => (
              <li key={source.law.id}>
                {source.law.act} — {t.answer.section} {source.law.section}
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="mt-3 text-xs italic text-muted-foreground">{card.disclaimer}</p>
    </div>
  );
}

function HelplinesPreview({
  helplines,
  reason,
}: {
  helplines: import("@/data/types").Helpline[];
  reason: "red" | "minor" | null;
}) {
  const { t } = useI18n();
  const isRed = reason === "red";

  return (
    <div
      className={`rounded-2xl border px-4 py-4 shadow-sm ${
        isRed
          ? "border-urgency-red/30 bg-urgency-red-surface"
          : "border-urgency-amber/30 bg-urgency-amber-surface"
      }`}
    >
      <h3
        className={`mb-1 text-sm font-semibold ${
          isRed ? "text-urgency-red-foreground" : "text-urgency-amber-foreground"
        }`}
      >
        {isRed ? t.urgency.redTitle : t.urgency.minorTitle}
      </h3>
      <p
        className={`mb-3 text-xs ${
          isRed ? "text-urgency-red-foreground" : "text-urgency-amber-foreground"
        }`}
      >
        {isRed ? t.urgency.redBody : t.urgency.minorBody}
      </p>
      <ul className="space-y-1.5">
        {helplines.map((h) => (
          <li key={h.id}>
            <a
              href={`tel:${h.number}`}
              className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-sm font-medium shadow-sm ring-1 ring-border transition hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              aria-label={t.helplines.callAria
                .replace("{name}", t.helplines[h.labelKey])
                .replace("{number}", h.number)}
            >
              <span>{t.helplines[h.labelKey]}</span>
              <span className="font-semibold">{h.number}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LegalAidPreview({ offices }: { offices: import("@/data/types").LegalAidOffice[] }) {
  const { t, locale } = useI18n();

  return (
    <div className="rounded-2xl border border-urgency-green/30 bg-urgency-green-surface px-4 py-4 shadow-sm">
      <h3 className="mb-1 text-sm font-semibold text-urgency-green-foreground">
        {t.legalAid.title}
      </h3>
      <p className="mb-3 text-xs text-urgency-green-foreground">{t.legalAid.subtitle}</p>
      <ul className="space-y-2">
        {offices.slice(0, 3).map((office) => (
          <li key={office.id} className="rounded-xl bg-card px-3 py-2 text-sm ring-1 ring-border">
            <p className="font-medium">{locale === "hi" ? office.name_hi : office.name_en}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              <a
                href={`tel:${office.phone}`}
                className="underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                {office.phone}
              </a>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
