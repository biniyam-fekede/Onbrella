import { useEffect, useState } from "react";
import { getHomeAnnouncementsContent } from "../api/contentClient";
import { defaultHomeAnnouncementsDocument } from "../content/contentRegistry";

/**
 * Loads the admin-managed home announcement document and falls back to
 * the bundled default copy when the content API is unavailable.
 */
export function useHomeAnnouncement() {
  const [announcement, setAnnouncement] = useState(defaultHomeAnnouncementsDocument);

  useEffect(() => {
    let cancelled = false;

    async function loadAnnouncement() {
      try {
        const res = await getHomeAnnouncementsContent();
        if (!cancelled && res?.document) {
          setAnnouncement(res.document);
        }
      } catch {
        if (!cancelled) {
          setAnnouncement(defaultHomeAnnouncementsDocument);
        }
      }
    }

    loadAnnouncement();
    return () => {
      cancelled = true;
    };
  }, []);

  return announcement;
}
