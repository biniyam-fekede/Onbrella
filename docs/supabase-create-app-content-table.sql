-- Create the app_content table used for editable admin-managed copy like:
-- - Terms and Conditions
-- - Privacy Policy
-- - FAQ / Help page content
-- - Home page announcements
-- - Support page text
-- Run this in Supabase SQL Editor (Dashboard -> SQL Editor).

CREATE TABLE IF NOT EXISTS public.app_content (
  content_key text PRIMARY KEY,
  document jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS app_content_updated_at_idx
  ON public.app_content (updated_at DESC);

COMMENT ON TABLE public.app_content IS 'Admin-managed structured content documents for the app.';

-- Seed the supported content documents. The same table stores all content types by content_key,
-- so no extra columns are required when adding more managed pages.
INSERT INTO public.app_content (content_key, document)
VALUES
  (
    'terms_and_conditions',
    $${
      "title": "On-Brella Terms of Service",
      "lastUpdatedLabel": "Last Updated: October 2023",
      "intro": "Please read these terms and conditions carefully before using our umbrella rental service. By accessing or using our service, you agree to be bound by these terms.",
      "sections": [
        {
          "id": "introduction",
          "number": "1.",
          "title": "Introduction",
          "variant": "default",
          "paragraphs": [
            "Welcome to On-Brella. These Terms of Service govern your use of our mobile application and the umbrella sharing stations located throughout the city.",
            "By registering for an account, you represent that you are at least 18 years old and have the legal capacity to enter into this agreement."
          ]
        }
      ]
    }$$::jsonb
  ),
  (
    'privacy_policy',
    $${
      "title": "On-Brella Privacy Policy",
      "lastUpdatedLabel": "Last Updated: March 2026",
      "intro": "This Privacy Policy explains what data On-Brella collects, how we use it, and the choices you have when using our umbrella rental service.",
      "sections": [
        {
          "id": "data-we-collect",
          "number": "1.",
          "title": "Data We Collect",
          "paragraphs": [
            "We collect account details such as your name, email address, and optional profile information when you sign up.",
            "We also collect rental activity, support requests, and technical diagnostics needed to operate the service."
          ]
        }
      ]
    }$$::jsonb
  ),
  (
    'help_faq',
    $${
      "title": "Help & Support",
      "intro": "Find quick answers below, or contact the support team if you still need help with a rental, return, or account issue.",
      "faqTitle": "Frequently Asked Questions",
      "faqs": [
        {
          "question": "How do I rent an umbrella?",
          "answer": "Scan the QR code on any On-Brella station in the app. Once confirmed, the umbrella is released automatically."
        },
        {
          "question": "Where can I return it?",
          "answer": "You can return an umbrella to any available slot at any On-Brella station. The map shows nearby stations and open capacity."
        }
      ],
      "supportCard": {
        "title": "Still need help?",
        "description": "Our support team is available 24/7 to help with urgent rental issues.",
        "buttonLabel": "Submit a Complaint"
      },
      "legalLinks": [
        { "label": "Terms and Conditions", "path": "/profile/help/terms" },
        { "label": "Privacy Policy", "path": "/profile/help/privacy" }
      ]
    }$$::jsonb
  ),
  (
    'home_page_announcements',
    $${
      "enabled": true,
      "badge": "Service Update",
      "title": "Rainy day reminder",
      "message": "Umbrella availability may change quickly during heavy rain. Check the live map before heading to a station.",
      "ctaLabel": "Need help?",
      "ctaPath": "/profile/help"
    }$$::jsonb
  ),
  (
    'support_page_text',
    $${
      "heroTitle": "How can we help?",
      "heroDescription": "Please share the issue you ran into and our team will review it as soon as possible.",
      "reasonTitle": "Select a Reason",
      "detailsLabel": "Other or more details",
      "detailsPlaceholder": "Tell us more about the issue...",
      "detailsRequiredHint": "Required for Other.",
      "detailsOptionalHint": "Optional, but helpful.",
      "submitLabel": "Submit Complaint",
      "submittingLabel": "Submitting...",
      "successMessage": "Your complaint has been submitted and flagged for the admin team as a critical alert.",
      "footerNote": "By submitting, you agree to our Terms of Service and help On-Brella improve for everyone.",
      "reasons": [
        { "value": "station_empty", "label": "Station Empty" },
        { "value": "station_full", "label": "Station Full" },
        { "value": "damaged_umbrella", "label": "Damaged Umbrella" },
        { "value": "app_issue", "label": "App Issue" },
        { "value": "other", "label": "Other" }
      ]
    }$$::jsonb
  )
ON CONFLICT (content_key) DO UPDATE
SET document = EXCLUDED.document,
    updated_at = now();
