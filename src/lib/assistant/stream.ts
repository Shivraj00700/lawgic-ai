/**
 * Timing helpers for the simulated stream.
 *
 * Every wait is cancellable and clears its own timer and listener. A demo that
 * leaves timers running behind an abandoned request starts firing state updates
 * into an unmounted component halfway through the next question.
 */

export class AbortError extends Error {
  constructor() {
    super("Aborted");
    this.name = "AbortError";
  }
}

export function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new AbortError();
}

/** Resolves after `ms`, or rejects immediately if the signal aborts. */
export function delay(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.reject(new AbortError());

  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    function onAbort() {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      reject(new AbortError());
    }

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * Deterministic pseudo-random generator.
 *
 * Seeded so timings jitter naturally but reproducibly — the same question
 * behaves the same way in a rehearsal and in the live demo, and tests are not
 * flaky.
 */
export function createJitter(seed = 1): (min: number, max: number) => number {
  let state = seed >>> 0 || 1;
  return (min: number, max: number) => {
    // xorshift32
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return min + (state / 0xffffffff) * (max - min);
  };
}

/** Pace of the fake stream, tuned to read as live inference rather than a spinner. */
export const TIMING = {
  thinkingMin: 320,
  thinkingMax: 620,
  retrievingMin: 260,
  retrievingMax: 480,
  tokenMin: 16,
  tokenMax: 46,
  beforeCard: 220,
  beforeAid: 260,
} as const;
