export const defaultTermsDocument = {
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

export const defaultPrivacyPolicyDocument = {
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

export const defaultHelpFaqDocument = {
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

export const defaultHomeAnnouncementsDocument = {
  enabled: true,
  badge: "Service Update",
  title: "Rainy day reminder",
  message:
    "Umbrella availability may change quickly during heavy rain. Check the live map before heading to a station.",
  ctaLabel: "Need help?",
  ctaPath: "/profile/help",
};

export const defaultSupportPageTextDocument = {
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
  successMessage:
    "Your complaint has been submitted and flagged for the admin team as a critical alert.",
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

export const contentEditorOptions = [
  {
    key: "terms",
    label: "Terms and Conditions",
    description: "Policy document shown on the Terms page in the app.",
  },
  {
    key: "privacy-policy",
    label: "Privacy Policy",
    description: "Policy document shown on the Privacy Policy page in the app.",
  },
  {
    key: "help-faq",
    label: "FAQ / Help Page",
    description: "FAQ answers, support card text, and legal links shown on Help & Support.",
  },
  {
    key: "home-announcements",
    label: "Home Page Announcements",
    description: "Announcement banner shown on the main map screen.",
  },
  {
    key: "support-page-text",
    label: "Support Page Text",
    description: "Hero copy, button labels, and complaint form reason labels.",
  },
];

export const defaultContentDocuments = {
  terms: defaultTermsDocument,
  "privacy-policy": defaultPrivacyPolicyDocument,
  "help-faq": defaultHelpFaqDocument,
  "home-announcements": defaultHomeAnnouncementsDocument,
  "support-page-text": defaultSupportPageTextDocument,
};
