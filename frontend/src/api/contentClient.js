import { config } from "../config";

const base = config.apiBaseUrl || "";

export async function getContent(contentKey) {
  const res = await fetch(`${base}/api/content/${encodeURIComponent(contentKey)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || res.statusText || "Request failed");
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

export async function getTermsContent() {
  return getContent("terms");
}

export async function getPrivacyPolicyContent() {
  return getContent("privacy-policy");
}

export async function getHelpFaqContent() {
  return getContent("help-faq");
}

export async function getHomeAnnouncementsContent() {
  return getContent("home-announcements");
}

export async function getSupportPageTextContent() {
  return getContent("support-page-text");
}
