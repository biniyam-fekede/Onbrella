const SESSION_STORAGE_KEY = "onbrella_home_announcement_session";

function normalizeAnnouncementField(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getAnnouncementId(announcement = {}) {
  return JSON.stringify({
    enabled: Boolean(announcement?.enabled),
    badge: normalizeAnnouncementField(announcement?.badge),
    title: normalizeAnnouncementField(announcement?.title),
    message: normalizeAnnouncementField(announcement?.message),
    ctaLabel: normalizeAnnouncementField(announcement?.ctaLabel),
    ctaPath: normalizeAnnouncementField(announcement?.ctaPath),
  });
}

function readSessionStore() {
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeSessionStore(store) {
  try {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Ignore storage failures and fall back to in-memory UI state.
  }
}

export function getAnnouncementSessionState(announcement) {
  const id = getAnnouncementId(announcement);
  const store = readSessionStore();
  const state = store[id];
  return {
    seen: Boolean(state?.seen),
    dismissed: Boolean(state?.dismissed),
  };
}

export function markAnnouncementSeen(announcement) {
  const id = getAnnouncementId(announcement);
  const store = readSessionStore();
  writeSessionStore({
    ...store,
    [id]: {
      ...store[id],
      seen: true,
    },
  });
}

export function dismissAnnouncementForSession(announcement) {
  const id = getAnnouncementId(announcement);
  const store = readSessionStore();
  writeSessionStore({
    ...store,
    [id]: {
      ...store[id],
      seen: true,
      dismissed: true,
    },
  });
}
