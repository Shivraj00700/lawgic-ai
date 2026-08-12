/**
 * English dictionary. This is the SOURCE OF TRUTH for the shape of every locale.
 * `hi.ts` is typed against `Dictionary` so a missing key is a compile error.
 */
export const en = {
  brand: {
    name: "Lawgic AI",
    tagline: "Know Your Rights, in Your Language",
  },

  lang: {
    label: "Language",
    en: "English",
    hi: "हिंदी",
    switchAria: "Change language",
  },

  disclaimer: {
    short: "General information, not legal advice",
    long: "Lawgic AI gives general legal information, not legal advice. A lawyer can confirm the specifics of your situation.",
    hedge: "This is general information — a lawyer can confirm the specifics of your case.",
  },

  nav: {
    newChat: "New Conversation",
    rights: "Know Your Rights",
    legalAid: "Find Legal Help",
    history: "My History",
    templates: "Document Templates",
    profile: "Profile & Settings",
    feedback: "Feedback",
    sos: "SOS / Emergency Help",
    comingSoon: "Coming soon",
    openMenu: "Open navigation menu",
    closeMenu: "Close navigation menu",
    backToChat: "Back to conversation",
  },

  topbar: {
    guest: "Guest",
    setState: "Set your state",
    stateSet: "State: {state}",
    profileAria: "Open profile and settings",
  },

  chat: {
    welcomeTitle: "What legal problem can I help with?",
    welcomeSubtitle:
      "Describe it in your own words. You will get your rights, the steps to take, and the law it comes from.",
    placeholder: "Example: my landlord will not return my deposit",
    send: "Send question",
    mic: "Ask by voice",
    micListening: "Listening — tap to stop",
    thinking: "Thinking",
    retrieving: "Checking verified sources",
    categoriesLabel: "Pick a topic",
    scenariosLabel: "Or try an example",
    youLabel: "You",
    assistantLabel: "Lawgic AI",
    liveRegionLabel: "Assistant response",
    emptyHistory: "No questions asked yet in this session.",
  },

  categories: {
    consumer: "Consumer & Money",
    housing: "Housing & Property",
    work: "Work & Wages",
    family: "Family",
    safety: "Safety & Crime",
    documents: "Documents & Entitlements",
  },

  scenarios: {
    defectiveProduct: "Defective product",
    unpaidWages: "Unpaid wages",
    deposit: "Landlord kept my deposit",
  },

  answer: {
    rights: "Your Possible Rights",
    steps: "What You Can Do Now",
    source: "Verified Source",
    why: "Why this answer?",
    whyHint: "See the exact law this came from",
    matchReason: "Why this law was matched",
    explainMore: "Explain more",
    explainLess: "Show less",
    readAloud: "Read aloud",
    stopReading: "Stop reading",
    openSource: "Open official source",
    section: "Section",
    confidenceLabel: "Confidence",
    confidence: {
      high: "Strong match to a verified law",
      medium: "Partial match — read the source",
      low: "No confident match found",
    },
    lowConfidenceBody:
      "I could not match your question to a law in my verified set with confidence. Rather than guess, here is how to reach a real legal aid officer.",
  },

  urgency: {
    redTitle: "Your safety comes first",
    redBody:
      "If you or someone else is in danger right now, call one of these numbers. They are free and open at all hours.",
    orangeTitle: "This may need urgent help",
    orangeBody: "You can speak to someone now while you read the information below.",
    minorTitle: "Please talk to an adult you trust",
    minorBody:
      "If you are under 18, the safest first step is telling an adult you trust — a parent, teacher, or relative. You can also call Childline free at any time.",
    callNow: "Call {name}",
  },

  helplines: {
    title: "Emergency Helplines",
    subtitle: "Free, no login needed",
    police: "Police",
    women: "Women's Helpline",
    child: "Childline",
    cyber: "Cyber Crime",
    nalsa: "Legal Aid",
    callAria: "Call {name} at {number}",
  },

  legalAid: {
    title: "Talk to a real legal aid officer",
    subtitle: "Free legal aid is a right, not a favour.",
    national: "National",
    stateLevel: "In your state",
    pickState: "Choose your state to see your nearest legal services authority",
    eligibility:
      "Free legal aid is available to women, children, SC/ST citizens, persons with disability, industrial workmen, and anyone earning under the state income limit.",
    call: "Call",
    email: "Email",
    website: "Visit website",
    directoryTitle: "Find Legal Help",
    directorySubtitle:
      "National and state legal services authorities. Free representation, no login required.",
  },

  rights: {
    title: "Know Your Rights",
    subtitle:
      "Plain-language summaries of the laws behind your rights, grouped by the area of life they cover.",
    lawCount: "{count} laws",
    beneficiaries: "Applies to",
    readSource: "Read the official text",
    scopeIndia: "All of India",
    scopeState: "State-specific",
  },

  history: {
    title: "My History",
    subtitle: "Questions you asked in this session.",
    sessionOnly:
      "Kept only for this session. Nothing is saved to a server and nothing leaves your device.",
    askAgain: "Ask again",
  },

  profile: {
    title: "Profile & Settings",
    subtitle: "All optional. Skip anything you would rather not share.",
    state: "State",
    statePlaceholder: "Select your state",
    stateWhy: "Used only to match state-specific law and your nearest legal aid office.",
    ageBand: "Age group",
    ageBandWhy: "Some rights and protections depend on age.",
    gender: "Gender",
    genderWhy: "Some laws provide specific protections. Answer only if you want to.",
    preferNotToSay: "Prefer not to say",
    privacyNote:
      "We never ask for your name, phone number, or date of birth. Everything here stays on your device.",
    save: "Save",
    skip: "Skip for now",
    clear: "Clear",
    ageBands: {
      under18: "Under 18",
      "18to25": "18–25",
      "26to40": "26–40",
      "41to60": "41–60",
      over60: "Over 60",
    },
    genders: {
      female: "Female",
      male: "Male",
      other: "Other",
    },
  },

  languageGate: {
    title: "Choose your language",
    subtitle: "You can change this at any time.",
  },

  landing: {
    heroCta: "Ask a legal question",
    heroSecondary: "See how it works",
    sosLabel: "Emergency help",
    navFeatures: "What it does",
    navHow: "How it works",
    navFaq: "Questions",
    heroTitle: "Your rights, in your words",
    heroBody:
      "Describe your problem the way you would to a friend. Lawgic AI tells you which rights protect you, what you can do next, and the exact law it comes from.",
    heroFootnote: "Free · No login · English and Hindi",
    featuresEyebrow: "Built for people who were never handed a rulebook",
    featuresTitle: "Answers you can act on, and check",
    featuresBody:
      "Not a wall of legal text. A short list of your rights, the steps to take, and the source behind both.",
    features: {
      citedTitle: "Every answer names its law",
      citedBody:
        'Each card shows the Act and Section it came from. Tap "Why this answer?" to read the clause yourself.',
      honestTitle: "It admits what it does not know",
      honestBody:
        "When nothing matches with confidence, it says so and points you to a real legal aid officer instead of guessing.",
      urgencyTitle: "It notices an emergency",
      urgencyBody:
        "If your words suggest immediate danger, the legal explanation steps aside and free helplines come first.",
      actionTitle: "It ends with a next step",
      actionBody:
        "Every conversation closes with the legal aid authority for your state, with a number you can call.",
      voiceTitle: "You can speak, and listen",
      voiceBody:
        "Ask out loud and have the answer read back. Reading and writing are not required to use this.",
      languageTitle: "English and Hindi",
      languageBody:
        "The whole answer is translated, not just the buttons around it. More languages are on the way.",
    },
    howTitle: "Three steps, about a minute",
    how: {
      oneTitle: "Say what happened",
      oneBody: "Type it, tap a topic, or speak. Your own words are enough — no legal terms needed.",
      twoTitle: "Read your rights and steps",
      twoBody: "A short card: what protects you, what to do now, and the law behind it.",
      threeTitle: "Reach a real person",
      threeBody: "Every answer ends with free legal aid for your state, and a number that works.",
    },
    faqTitle: "The questions people ask first",
    faq: {
      qHallucination: "How do I know it is not making the law up?",
      aHallucination:
        "Every answer is matched against a fixed set of verified laws, and each card shows the Act and Section it used. If a question cannot be matched with confidence, the assistant says so and hands you to legal aid rather than inventing an answer.",
      qChatgpt: "How is this different from a general AI chatbot?",
      aChatgpt:
        "Three ways. Answers are traceable to a named law you can open and read. Dangerous situations are detected and helplines come before legal explanation. And every conversation ends in a concrete handoff to free legal aid, not just information.",
      qPrivacy: "What happens to what I type?",
      aPrivacy:
        "Nothing leaves your browser. There is no account and no server storing your conversation. The optional state and age you can share are kept on your own device and used only to match local law.",
      qCost: "Does it cost anything?",
      aCost:
        "No. Free legal aid in India is a right under the Legal Services Authorities Act, and this tool exists to help people reach it. There is nothing to pay and nothing to sign up for.",
    },
    ctaTitle: "Start with whatever is worrying you",
    ctaBody: "One question is enough. You do not need to know the law to ask about it.",
    footerRights: "All rights reserved.",
  },

  common: {
    close: "Close",
    cancel: "Cancel",
    back: "Back",
    loading: "Loading",
    comingSoonNote: "Not in this version yet",
  },
} as const;

/**
 * Widens the `as const` literal types back to `string` so other locales must
 * match the SHAPE of `en` without having to match its exact wording.
 * A missing or misspelled key in another locale becomes a compile error.
 */
type Widen<T> = T extends string ? string : { [K in keyof T]: Widen<T[K]> };

export type Dictionary = Widen<typeof en>;
