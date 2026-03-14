import { supabase } from "@/lib/supabase/client";
import { config } from "../config";
import { getSessionId } from "./client";

const base = config.apiBaseUrl || "";

async function getAccessToken() {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (token) return token;

  const { data, error } = await supabase.auth.refreshSession();
  const refreshedToken = data?.session?.access_token;
  if (error || !refreshedToken) {
    throw new Error("Not authenticated");
  }

  return refreshedToken;
}

export async function submitSupportRequest(payload) {
  const token = await getAccessToken();
  const res = await fetch(`${base}/api/support/requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Session-Id": getSessionId(),
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || res.statusText || "Request failed");
    err.status = res.status;
    err.payload = data;
    throw err;
  }

  return data;
}
