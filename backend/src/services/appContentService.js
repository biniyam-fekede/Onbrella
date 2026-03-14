const db = require("../db");
const config = require("../config");

function ensureString(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => ensureString(item)).filter(Boolean);
}

function normalizeCards(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((card, index) => ({
      label: ensureString(card?.label, `Item ${index + 1}`),
      value: ensureString(card?.value),
      tone: ensureString(card?.tone),
    }))
    .filter((card) => card.label && card.value);
}

function normalizeSections(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((section, index) => {
      const variant = ensureString(section?.variant, "default") || "default";
      return {
        id: ensureString(section?.id, `section-${index + 1}`),
        number: ensureString(section?.number, `${index + 1}.`),
        title: ensureString(section?.title, `Section ${index + 1}`),
        variant,
        paragraphs: normalizeStringArray(section?.paragraphs),
        bullets: normalizeStringArray(section?.bullets),
        checklist: normalizeStringArray(section?.checklist),
        cards: normalizeCards(section?.cards),
        note: ensureString(section?.note),
      };
    })
    .filter((section) => section.title);
}

function normalizeFaqItems(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      question: ensureString(item?.question),
      answer: ensureString(item?.answer),
    }))
    .filter((item) => item.question && item.answer);
}

function normalizeLinkItems(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      label: ensureString(item?.label),
      path: ensureString(item?.path),
    }))
    .filter((item) => item.label && item.path);
}

function normalizeSupportReasons(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => ({
      value: ensureString(item?.value, `reason_${index + 1}`),
      label: ensureString(item?.label, `Reason ${index + 1}`),
    }))
    .filter((item) => item.value && item.label);
}

const defaultTermsDocument = {
  title: "On-Brella Terms of Service",
  lastUpdatedLabel: "Last Updated: October 2023",
  intro:
    "Please read these terms and conditions carefully before using our umbrella rental service. By accessing or using our service, you agree to be bound by these terms.",
  sections: [
    {
      id: "introduction",
      number: "1.",
      title: "Introduction",
      variant: "default",
      paragraphs: [
        "Welcome to On-Brella. These Terms of Service govern your use of our mobile application and the umbrella sharing stations located throughout the city.",
        "By registering for an account, you represent that you are at least 18 years old and have the legal capacity to enter into this agreement.",
      ],
    },
    {
      id: "rental-terms",
      number: "2.",
      title: "Rental Terms",
      variant: "default",
      paragraphs: [
        "Rentals begin the moment an umbrella is released from the station and end when it is successfully locked back into an official On-Brella station.",
      ],
      bullets: [
        "Maximum rental duration is 48 consecutive hours.",
        "Umbrellas must be returned to a functional station dock.",
        "The app will confirm the successful return of the equipment.",
      ],
    },
    {
      id: "user-responsibilities",
      number: "3.",
      title: "User Responsibilities",
      variant: "highlight",
      paragraphs: [
        "Users are expected to treat the equipment with care. You are responsible for:",
      ],
      checklist: [
        "Inspecting the umbrella for damage before use.",
        "Reporting any malfunctions through the app immediately.",
        "Ensuring the umbrella is securely docked upon return.",
      ],
    },
    {
      id: "fees-and-payments",
      number: "4.",
      title: "Fees and Payments",
      variant: "pricing",
      cards: [
        { label: "Base Rate (First 2 hours)", value: "$2.00" },
        { label: "Hourly Rate (After 2 hours)", value: "$1.00/hr" },
        { label: "Lost/Damaged Fee", value: "$25.00", tone: "danger" },
      ],
      note:
        "All payments are processed securely via our third-party payment provider. Taxes may apply based on your location.",
    },
  ],
};

const defaultPrivacyPolicyDocument = {
  title: "On-Brella Privacy Policy",
  lastUpdatedLabel: "Last Updated: March 2026",
  intro:
    "This Privacy Policy explains what data On-Brella collects, how we use it, and the choices you have when using our umbrella rental service.",
  sections: [
    {
      id: "data-we-collect",
      number: "1.",
      title: "Data We Collect",
      paragraphs: [
        "We collect account details such as your name, email address, and optional profile information when you sign up.",
        "We also collect rental activity, support requests, and technical diagnostics needed to operate the service.",
      ],
    },
    {
      id: "how-we-use-data",
      number: "2.",
      title: "How We Use Data",
      variant: "highlight",
      checklist: [
        "To authenticate your account and keep the app secure.",
        "To process rentals, returns, and billing events.",
        "To improve station availability, performance, and support quality.",
      ],
    },
    {
      id: "sharing-and-retention",
      number: "3.",
      title: "Sharing and Retention",
      paragraphs: [
        "We only share data with service providers that help us operate On-Brella, such as payment and hosting partners.",
        "We retain information for only as long as necessary to provide the service, meet legal obligations, and resolve disputes.",
      ],
    },
  ],
};

const defaultHelpFaqDocument = {
  title: "Help & Support",
  intro:
    "Find quick answers below, or contact the support team if you still need help with a rental, return, or account issue.",
  faqTitle: "Frequently Asked Questions",
  faqs: [
    {
      question: "How do I rent an umbrella?",
      answer:
        "Scan the QR code on any On-Brella station in the app. Once confirmed, the umbrella is released automatically.",
    },
    {
      question: "Where can I return it?",
      answer:
        "You can return an umbrella to any available slot at any On-Brella station. The map shows nearby stations and open capacity.",
    },
    {
      question: "What if the station is full?",
      answer:
        "Check the map for the nearest alternative station. If your closest station is full, you can use another official On-Brella dock.",
    },
    {
      question: "Is there a deposit fee?",
      answer:
        "A temporary payment hold may be placed when your rental begins and is released after a successful return.",
    },
  ],
  supportCard: {
    title: "Still need help?",
    description: "Our support team is available 24/7 to help with urgent rental issues.",
    buttonLabel: "Submit a Complaint",
  },
  legalLinks: [
    { label: "Terms and Conditions", path: "/profile/help/terms" },
    { label: "Privacy Policy", path: "/profile/help/privacy" },
  ],
};

const defaultHomeAnnouncementsDocument = {
  enabled: true,
  badge: "Service Update",
  title: "Rainy day reminder",
  message:
    "Umbrella availability may change quickly during heavy rain. Check the live map before heading to a station.",
  ctaLabel: "Need help?",
  ctaPath: "/profile/help",
};

const defaultSupportPageTextDocument = {
  heroTitle: "How can we help?",
  heroDescription:
    "Please share the issue you ran into and our team will review it as soon as possible.",
  reasonTitle: "Select a Reason",
  detailsLabel: "Other or more details",
  detailsPlaceholder: "Tell us more about the issue...",
  detailsRequiredHint: "Required for Other.",
  detailsOptionalHint: "Optional, but helpful.",
  submitLabel: "Submit Complaint",
  submittingLabel: "Submitting...",
  successMessage: "Your complaint has been submitted and flagged for the admin team as a critical alert.",
  footerNote:
    "By submitting, you agree to our Terms of Service and help On-Brella improve for everyone.",
  reasons: [
    { value: "station_empty", label: "Station Empty" },
    { value: "station_full", label: "Station Full" },
    { value: "damaged_umbrella", label: "Damaged Umbrella" },
    { value: "app_issue", label: "App Issue" },
    { value: "other", label: "Other" },
  ],
};

function normalizePolicyDocument(input = {}, fallback) {
  const document = {
    title: ensureString(input?.title, fallback.title),
    lastUpdatedLabel: ensureString(input?.lastUpdatedLabel, fallback.lastUpdatedLabel),
    intro: ensureString(input?.intro, fallback.intro),
    sections: normalizeSections(input?.sections),
  };

  if (document.sections.length === 0) {
    document.sections = fallback.sections;
  }

  return document;
}

function validatePolicyDocument(document, label, fallback) {
  if (!document || typeof document !== "object") {
    throw new Error(`${label} document must be an object.`);
  }
  if (!ensureString(document.title)) {
    throw new Error(`${label} title is required.`);
  }
  if (!ensureString(document.lastUpdatedLabel)) {
    throw new Error(`${label} last updated label is required.`);
  }
  const sections = normalizeSections(document.sections);
  if (sections.length === 0) {
    throw new Error(`At least one ${label.toLowerCase()} section is required.`);
  }
  return normalizePolicyDocument({ ...document, sections }, fallback);
}

function normalizeHelpFaqDocument(input = {}) {
  const document = {
    title: ensureString(input?.title, defaultHelpFaqDocument.title),
    intro: ensureString(input?.intro, defaultHelpFaqDocument.intro),
    faqTitle: ensureString(input?.faqTitle, defaultHelpFaqDocument.faqTitle),
    faqs: normalizeFaqItems(input?.faqs),
    supportCard: {
      title: ensureString(input?.supportCard?.title, defaultHelpFaqDocument.supportCard.title),
      description: ensureString(
        input?.supportCard?.description,
        defaultHelpFaqDocument.supportCard.description
      ),
      buttonLabel: ensureString(
        input?.supportCard?.buttonLabel,
        defaultHelpFaqDocument.supportCard.buttonLabel
      ),
    },
    legalLinks: normalizeLinkItems(input?.legalLinks),
  };

  if (document.faqs.length === 0) {
    document.faqs = defaultHelpFaqDocument.faqs;
  }
  if (document.legalLinks.length === 0) {
    document.legalLinks = defaultHelpFaqDocument.legalLinks;
  }

  return document;
}

function validateHelpFaqDocument(document) {
  if (!document || typeof document !== "object") {
    throw new Error("Help page document must be an object.");
  }
  const normalized = normalizeHelpFaqDocument(document);
  if (!ensureString(normalized.title)) {
    throw new Error("Help page title is required.");
  }
  if (normalized.faqs.length === 0) {
    throw new Error("At least one FAQ item is required.");
  }
  return normalized;
}

function normalizeHomeAnnouncementsDocument(input = {}) {
  return {
    enabled: input?.enabled !== undefined ? Boolean(input.enabled) : defaultHomeAnnouncementsDocument.enabled,
    badge: ensureString(input?.badge, defaultHomeAnnouncementsDocument.badge),
    title: ensureString(input?.title, defaultHomeAnnouncementsDocument.title),
    message: ensureString(input?.message, defaultHomeAnnouncementsDocument.message),
    ctaLabel: ensureString(input?.ctaLabel, defaultHomeAnnouncementsDocument.ctaLabel),
    ctaPath: ensureString(input?.ctaPath, defaultHomeAnnouncementsDocument.ctaPath),
  };
}

function validateHomeAnnouncementsDocument(document) {
  if (!document || typeof document !== "object") {
    throw new Error("Home announcements document must be an object.");
  }
  const normalized = normalizeHomeAnnouncementsDocument(document);
  if (!normalized.title) {
    throw new Error("Announcement title is required.");
  }
  if (!normalized.message) {
    throw new Error("Announcement message is required.");
  }
  return normalized;
}

function normalizeSupportPageTextDocument(input = {}) {
  const document = {
    heroTitle: ensureString(input?.heroTitle, defaultSupportPageTextDocument.heroTitle),
    heroDescription: ensureString(
      input?.heroDescription,
      defaultSupportPageTextDocument.heroDescription
    ),
    reasonTitle: ensureString(input?.reasonTitle, defaultSupportPageTextDocument.reasonTitle),
    detailsLabel: ensureString(input?.detailsLabel, defaultSupportPageTextDocument.detailsLabel),
    detailsPlaceholder: ensureString(
      input?.detailsPlaceholder,
      defaultSupportPageTextDocument.detailsPlaceholder
    ),
    detailsRequiredHint: ensureString(
      input?.detailsRequiredHint,
      defaultSupportPageTextDocument.detailsRequiredHint
    ),
    detailsOptionalHint: ensureString(
      input?.detailsOptionalHint,
      defaultSupportPageTextDocument.detailsOptionalHint
    ),
    submitLabel: ensureString(input?.submitLabel, defaultSupportPageTextDocument.submitLabel),
    submittingLabel: ensureString(
      input?.submittingLabel,
      defaultSupportPageTextDocument.submittingLabel
    ),
    successMessage: ensureString(
      input?.successMessage,
      defaultSupportPageTextDocument.successMessage
    ),
    footerNote: ensureString(input?.footerNote, defaultSupportPageTextDocument.footerNote),
    reasons: normalizeSupportReasons(input?.reasons),
  };

  if (document.reasons.length === 0) {
    document.reasons = defaultSupportPageTextDocument.reasons;
  }

  return document;
}

function validateSupportPageTextDocument(document) {
  if (!document || typeof document !== "object") {
    throw new Error("Support page text document must be an object.");
  }
  const normalized = normalizeSupportPageTextDocument(document);
  if (!normalized.heroTitle) {
    throw new Error("Support page hero title is required.");
  }
  if (normalized.reasons.length === 0) {
    throw new Error("At least one support reason is required.");
  }
  return normalized;
}

const APP_CONTENT_DEFINITIONS = {
  terms: {
    storageKey: "terms_and_conditions",
    label: "Terms and Conditions",
    defaultDocument: defaultTermsDocument,
    normalizeDocument: (document) => normalizePolicyDocument(document, defaultTermsDocument),
    validateDocument: (document) =>
      validatePolicyDocument(document, "Terms", defaultTermsDocument),
  },
  "privacy-policy": {
    storageKey: "privacy_policy",
    label: "Privacy Policy",
    defaultDocument: defaultPrivacyPolicyDocument,
    normalizeDocument: (document) =>
      normalizePolicyDocument(document, defaultPrivacyPolicyDocument),
    validateDocument: (document) =>
      validatePolicyDocument(document, "Privacy Policy", defaultPrivacyPolicyDocument),
  },
  "help-faq": {
    storageKey: "help_faq",
    label: "FAQ / Help Page",
    defaultDocument: defaultHelpFaqDocument,
    normalizeDocument: normalizeHelpFaqDocument,
    validateDocument: validateHelpFaqDocument,
  },
  "home-announcements": {
    storageKey: "home_page_announcements",
    label: "Home Page Announcements",
    defaultDocument: defaultHomeAnnouncementsDocument,
    normalizeDocument: normalizeHomeAnnouncementsDocument,
    validateDocument: validateHomeAnnouncementsDocument,
  },
  "support-page-text": {
    storageKey: "support_page_text",
    label: "Support Page Text",
    defaultDocument: defaultSupportPageTextDocument,
    normalizeDocument: normalizeSupportPageTextDocument,
    validateDocument: validateSupportPageTextDocument,
  },
};

function getContentDefinition(contentType) {
  return APP_CONTENT_DEFINITIONS[contentType] || null;
}

function listAvailableContent() {
  return Object.entries(APP_CONTENT_DEFINITIONS).map(([key, definition]) => ({
    key,
    label: definition.label,
    storageKey: definition.storageKey,
  }));
}

function mapRowToContent(contentType, row) {
  const definition = getContentDefinition(contentType);
  if (!definition || !row) return null;
  return {
    key: contentType,
    storageKey: definition.storageKey,
    label: definition.label,
    document: definition.normalizeDocument(row.document || {}),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    updatedBy: row.updated_by || null,
    source: "database",
  };
}

function buildDefaultContent(contentType) {
  const definition = getContentDefinition(contentType);
  if (!definition) return null;
  return {
    key: contentType,
    storageKey: definition.storageKey,
    label: definition.label,
    document: definition.defaultDocument,
    updatedAt: null,
    updatedBy: null,
    source: "default",
  };
}

async function getContent(contentType) {
  const definition = getContentDefinition(contentType);
  if (!definition) {
    const err = new Error("Unknown content type");
    err.statusCode = 404;
    throw err;
  }

  if (!config.databaseUrl) {
    return buildDefaultContent(contentType);
  }

  try {
    const { rows } = await db.query(
      `SELECT content_key, document, updated_at, updated_by
       FROM app_content
       WHERE content_key = $1
       LIMIT 1`,
      [definition.storageKey]
    );
    if (!rows[0]) {
      return buildDefaultContent(contentType);
    }
    return mapRowToContent(contentType, rows[0]);
  } catch (err) {
    if (err.code === "42P01") {
      return buildDefaultContent(contentType);
    }
    throw err;
  }
}

async function updateContent(contentType, document, updatedBy) {
  const definition = getContentDefinition(contentType);
  if (!definition) {
    const err = new Error("Unknown content type");
    err.statusCode = 404;
    throw err;
  }

  if (!config.databaseUrl) {
    throw new Error("Database not configured. Set DATABASE_URL in backend/.env");
  }

  const normalizedDocument = definition.validateDocument(document);
  const { rows } = await db.query(
    `INSERT INTO app_content (content_key, document, updated_at, updated_by)
     VALUES ($1, $2::jsonb, now(), $3)
     ON CONFLICT (content_key)
     DO UPDATE SET
       document = EXCLUDED.document,
       updated_at = now(),
       updated_by = EXCLUDED.updated_by
     RETURNING content_key, document, updated_at, updated_by`,
    [definition.storageKey, JSON.stringify(normalizedDocument), updatedBy || null]
  );

  return mapRowToContent(contentType, rows[0]);
}

module.exports = {
  APP_CONTENT_DEFINITIONS,
  defaultTermsDocument,
  defaultPrivacyPolicyDocument,
  defaultHelpFaqDocument,
  defaultHomeAnnouncementsDocument,
  defaultSupportPageTextDocument,
  getContentDefinition,
  listAvailableContent,
  getContent,
  updateContent,
};
