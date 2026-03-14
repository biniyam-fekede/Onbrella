import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate({ name, email }) {
  const errors = {};
  if (!name || !String(name).trim()) errors.name = "Name is required.";
  if (!email || !String(email).trim()) errors.email = "Email is required.";
  else if (!emailRegex.test(String(email).trim())) errors.email = "Please enter a valid email address.";
  return errors;
}

/**
 * Personal Information page — edit name, location, email. Persists via UserContext (Supabase profiles).
 *
 * Layout: Back to account link, About card (name, location),
 * Contact card (email), Save Changes. Validation on name and email before save.
 */
export function PersonalInfoPage() {
  const { user, loading, updateUser } = useUser();
  const successTimerRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [editData, setEditData] = useState({
    name: "",
    email: "",
    location: "",
  });

  useEffect(() => {
    if (user) {
      setEditData({
        name: user.name ?? "",
        email: user.email ?? "",
        location: user.location ?? "",
      });
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        window.clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  const handleSave = async () => {
    const errors = validate(editData);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaveError(null);
    setSaveSuccess(false);
    setIsSaving(true);
    try {
      await updateUser({
        name: String(editData.name).trim(),
        email: String(editData.email).trim(),
        location: String(editData.location ?? "").trim(),
      });
      setSaveSuccess(true);
      if (successTimerRef.current) {
        window.clearTimeout(successTimerRef.current);
      }
      successTimerRef.current = window.setTimeout(() => {
        setSaveSuccess(false);
        successTimerRef.current = null;
      }, 3000);
    } catch (err) {
      console.error("Failed to save personal info:", err);
      setSaveError(err.message || "Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setSaveError(null);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col">
        <main className="flex-1 w-full max-w-md mx-auto px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 md:pt-8 pb-12">
          <div className="h-6 w-24 rounded bg-slate-200 dark:bg-slate-800 animate-pulse mb-4" />
          <div className="h-8 w-48 rounded bg-slate-200 dark:bg-slate-800 animate-pulse mb-6" />
          <div className="h-12 w-full rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col overflow-x-hidden">
      <main className="flex-1 w-full max-w-md mx-auto px-4 sm:px-6 md:px-8 pt-4 sm:pt-6 md:pt-8 pb-12 overflow-y-auto">
        <Link
          to="/profile"
          className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary font-medium text-sm mb-4 -ml-1 transition-colors"
        >
          <span className="material-symbols-outlined text-2xl">chevron_left</span>
          Back to account
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 px-1">Personal Information</h1>

        {saveError && (
          <div className="mb-4 p-3 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-300">{saveError}</p>
          </div>
        )}
        {saveSuccess && (
          <div className="mb-4 p-3 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-700 dark:text-green-300">Saved.</p>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 px-1 text-slate-900 dark:text-slate-100">About</h2>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="flex items-center px-4 py-4 border-b border-slate-50 dark:border-slate-800">
              <span className="material-symbols-outlined text-slate-900 dark:text-slate-100 mr-4">person</span>
              <input
                type="text"
                value={editData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Full name"
                className="flex-1 bg-transparent border-none p-0 text-[17px] font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-0 focus:outline-none min-w-0"
              />
            </div>
            <div className="flex items-center px-4 py-4">
              <span className="material-symbols-outlined text-slate-900 dark:text-slate-100 mr-4 shrink-0">home</span>
              <input
                type="text"
                value={editData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                placeholder="Location"
                className="flex-1 bg-transparent border-none p-0 text-[17px] font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-0 focus:outline-none min-w-0"
              />
            </div>
          </div>
          {fieldErrors.name && <p className="text-sm text-red-500 mt-1 px-1">{fieldErrors.name}</p>}
        </div>

        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-4 px-1 text-slate-900 dark:text-slate-100">Contact</h2>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="flex items-center px-4 py-4">
              <span className="material-symbols-outlined text-slate-900 dark:text-slate-100 mr-4 shrink-0">mail</span>
              <input
                type="email"
                value={editData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Email address"
                className="flex-1 bg-transparent border-none p-0 text-[17px] font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-0 focus:outline-none min-w-0"
              />
            </div>
          </div>
          {fieldErrors.email && <p className="text-sm text-red-500 mt-1 px-1">{fieldErrors.email}</p>}
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-2xl flex items-center justify-center font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {isSaving ? "Saving…" : "Save Changes"}
        </button>

        <div className="h-8" />
      </main>

      <div className="w-full max-w-md mx-auto flex justify-center pb-2 bg-background-light dark:bg-background-dark pt-2">
        <div className="w-32 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
      </div>
    </div>
  );
}
