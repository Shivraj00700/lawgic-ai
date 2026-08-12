import type { Helpline } from "./types";

/**
 * Live national helpline numbers in India. All are free and reachable without
 * any login. This single fixture drives three surfaces: the emergency helplines
 * row on the chat screen, the SOS sheet, and the red-tier urgency banner.
 *
 * Order is deliberate — the general emergency number comes first, because in a
 * red-tier moment a user should not have to choose.
 */
export const HELPLINES: Helpline[] = [
  { id: "emergency", number: "112", labelKey: "police", showInEmergency: true },
  { id: "women", number: "181", labelKey: "women", showInEmergency: true },
  { id: "child", number: "1098", labelKey: "child", showInEmergency: true },
  { id: "cyber", number: "1930", labelKey: "cyber", showInEmergency: true },
  { id: "nalsa", number: "15100", labelKey: "nalsa", showInEmergency: false },
];

export const EMERGENCY_HELPLINES = HELPLINES.filter((h) => h.showInEmergency);

/** Childline, surfaced on its own in the minor-disclosure flow. */
export const CHILDLINE = HELPLINES.find((h) => h.id === "child")!;
