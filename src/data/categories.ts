import {
  Banknote,
  Home,
  Briefcase,
  Users,
  ShieldAlert,
  FileBadge,
  type LucideIcon,
} from "lucide-react";

import { CATEGORY_IDS, type CategoryId } from "./types";

export type Category = {
  id: CategoryId;
  icon: LucideIcon;
  /** Seed question used when the user taps the tile instead of typing. */
  seed_en: string;
  seed_hi: string;
};

/**
 * Order matters — this is the on-screen tile order, arranged so the two most
 * common problem areas (money, housing) come first.
 */
export const CATEGORIES: Category[] = [
  {
    id: "consumer",
    icon: Banknote,
    seed_en: "I have a problem with something I bought or paid for",
    seed_hi: "मैंने जो खरीदा या जिसके पैसे दिए, उसमें समस्या है",
  },
  {
    id: "housing",
    icon: Home,
    seed_en: "I have a problem with my rented house or my property",
    seed_hi: "मेरे किराये के मकान या संपत्ति में समस्या है",
  },
  {
    id: "work",
    icon: Briefcase,
    seed_en: "I have a problem at work or with my wages",
    seed_hi: "मुझे काम या मज़दूरी में समस्या है",
  },
  {
    id: "family",
    icon: Users,
    seed_en: "I have a family matter — marriage, maintenance, or inheritance",
    seed_hi: "मेरा पारिवारिक मामला है — विवाह, भरण-पोषण, या विरासत",
  },
  {
    id: "safety",
    icon: ShieldAlert,
    seed_en: "Someone has threatened, harassed, or harmed me",
    seed_hi: "किसी ने मुझे धमकाया, परेशान किया, या नुकसान पहुँचाया है",
  },
  {
    id: "documents",
    icon: FileBadge,
    seed_en: "I need a government document or a benefit I am entitled to",
    seed_hi: "मुझे कोई सरकारी दस्तावेज़ या मेरा हक़ चाहिए",
  },
];

export const CATEGORY_BY_ID: Record<CategoryId, Category> = CATEGORIES.reduce(
  (acc, category) => {
    acc[category.id] = category;
    return acc;
  },
  {} as Record<CategoryId, Category>,
);

/** Guard used when parsing untrusted input such as a URL parameter. */
export function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === "string" && (CATEGORY_IDS as readonly string[]).includes(value);
}
