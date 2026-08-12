import { STATE_CODES, type LegalAidOffice, type StateCode } from "./types";

/** Display names for the state picker and the "State: X" chip. */
export const STATE_NAMES: Record<StateCode, { en: string; hi: string }> = {
  AP: { en: "Andhra Pradesh", hi: "आंध्र प्रदेश" },
  AS: { en: "Assam", hi: "असम" },
  BR: { en: "Bihar", hi: "बिहार" },
  CG: { en: "Chhattisgarh", hi: "छत्तीसगढ़" },
  DL: { en: "Delhi", hi: "दिल्ली" },
  GA: { en: "Goa", hi: "गोवा" },
  GJ: { en: "Gujarat", hi: "गुजरात" },
  HR: { en: "Haryana", hi: "हरियाणा" },
  HP: { en: "Himachal Pradesh", hi: "हिमाचल प्रदेश" },
  JH: { en: "Jharkhand", hi: "झारखंड" },
  JK: { en: "Jammu & Kashmir", hi: "जम्मू और कश्मीर" },
  KA: { en: "Karnataka", hi: "कर्नाटक" },
  KL: { en: "Kerala", hi: "केरल" },
  MP: { en: "Madhya Pradesh", hi: "मध्य प्रदेश" },
  MH: { en: "Maharashtra", hi: "महाराष्ट्र" },
  MN: { en: "Manipur", hi: "मणिपुर" },
  ML: { en: "Meghalaya", hi: "मेघालय" },
  MZ: { en: "Mizoram", hi: "मिज़ोरम" },
  NL: { en: "Nagaland", hi: "नागालैंड" },
  OD: { en: "Odisha", hi: "ओडिशा" },
  PB: { en: "Punjab", hi: "पंजाब" },
  RJ: { en: "Rajasthan", hi: "राजस्थान" },
  SK: { en: "Sikkim", hi: "सिक्किम" },
  TN: { en: "Tamil Nadu", hi: "तमिल नाडु" },
  TG: { en: "Telangana", hi: "तेलंगाना" },
  TR: { en: "Tripura", hi: "त्रिपुरा" },
  UP: { en: "Uttar Pradesh", hi: "उत्तर प्रदेश" },
  UK: { en: "Uttarakhand", hi: "उत्तराखंड" },
  WB: { en: "West Bengal", hi: "पश्चिम बंगाल" },
};

/** The national authority — always shown, and the fallback when no state is set. */
export const NALSA: LegalAidOffice = {
  id: "nalsa",
  scope: "IN",
  name_en: "National Legal Services Authority (NALSA)",
  name_hi: "राष्ट्रीय विधिक सेवा प्राधिकरण (नालसा)",
  phone: "15100",
  email: "nalsa-dla@nic.in",
  website: "https://nalsa.gov.in/",
};

/**
 * State Legal Services Authorities. Every state and UT has one under the Legal
 * Services Authorities Act, 1987; each is reachable through the NALSA portal.
 *
 * Phone numbers here are the national 15100 legal aid helpline, which routes to
 * the caller's state authority. That is deliberate: publishing a specific
 * office landline that may have changed is worse than a number guaranteed to
 * connect. The website link goes to the state's own authority page.
 */
const SLSA_SLUGS: Record<StateCode, string> = {
  AP: "andhra-pradesh",
  AS: "assam",
  BR: "bihar",
  CG: "chhattisgarh",
  DL: "delhi",
  GA: "goa",
  GJ: "gujarat",
  HR: "haryana",
  HP: "himachal-pradesh",
  JH: "jharkhand",
  JK: "jammu-kashmir",
  KA: "karnataka",
  KL: "kerala",
  MP: "madhya-pradesh",
  MH: "maharashtra",
  MN: "manipur",
  ML: "meghalaya",
  MZ: "mizoram",
  NL: "nagaland",
  OD: "odisha",
  PB: "punjab",
  RJ: "rajasthan",
  SK: "sikkim",
  TN: "tamil-nadu",
  TG: "telangana",
  TR: "tripura",
  UP: "uttar-pradesh",
  UK: "uttarakhand",
  WB: "west-bengal",
};

export const STATE_LEGAL_AID: LegalAidOffice[] = STATE_CODES.map((code) => ({
  id: `slsa-${code.toLowerCase()}`,
  scope: code,
  name_en: `${STATE_NAMES[code].en} State Legal Services Authority`,
  name_hi: `${STATE_NAMES[code].hi} राज्य विधिक सेवा प्राधिकरण`,
  phone: "15100",
  website: `https://nalsa.gov.in/slsa/${SLSA_SLUGS[code]}`,
}));

const STATE_LEGAL_AID_BY_CODE: Record<string, LegalAidOffice> = Object.fromEntries(
  STATE_LEGAL_AID.map((office) => [office.scope, office]),
);

/**
 * Returns the offices to show in the handoff card: NALSA always, plus the
 * user's state authority when a state is known.
 */
export function legalAidFor(state?: StateCode): LegalAidOffice[] {
  if (!state) return [NALSA];
  const stateOffice = STATE_LEGAL_AID_BY_CODE[state];
  return stateOffice ? [stateOffice, NALSA] : [NALSA];
}

export function isStateCode(value: unknown): value is StateCode {
  return typeof value === "string" && (STATE_CODES as readonly string[]).includes(value);
}
