import { beforeEach, describe, expect, it } from "vitest";
import {
  dismissAnnouncementForSession,
  getAnnouncementSessionState,
  markAnnouncementSeen,
} from "../src/utils/announcementSession";

const announcement = {
  enabled: true,
  badge: "Service Update",
  title: "Rainy day reminder",
  message: "Umbrella availability may change quickly during heavy rain.",
  ctaLabel: "Need help?",
  ctaPath: "/profile/help",
};

describe("announcementSession", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("starts unseen and not dismissed", () => {
    expect(getAnnouncementSessionState(announcement)).toEqual({
      seen: false,
      dismissed: false,
    });
  });

  it("marks an announcement as seen for the session", () => {
    markAnnouncementSeen(announcement);

    expect(getAnnouncementSessionState(announcement)).toEqual({
      seen: true,
      dismissed: false,
    });
  });

  it("marks an announcement as dismissed for the session", () => {
    dismissAnnouncementForSession(announcement);

    expect(getAnnouncementSessionState(announcement)).toEqual({
      seen: true,
      dismissed: true,
    });
  });

  it("tracks different announcement content separately", () => {
    const updatedAnnouncement = {
      ...announcement,
      title: "Storm alert",
    };

    dismissAnnouncementForSession(announcement);

    expect(getAnnouncementSessionState(updatedAnnouncement)).toEqual({
      seen: false,
      dismissed: false,
    });
  });
});
