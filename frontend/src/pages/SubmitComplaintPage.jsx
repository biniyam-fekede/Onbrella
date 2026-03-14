import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSupportPageTextContent } from "../api/contentClient";
import { submitSupportRequest } from "../api/supportClient";
import { defaultSupportPageTextDocument } from "../content/contentRegistry";

export function SubmitComplaintPage() {
  const navigate = useNavigate();
  const [content, setContent] = useState(defaultSupportPageTextDocument);
  const [reason, setReason] = useState(defaultSupportPageTextDocument.reasons[0].value);
  const [details, setDetails] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSupportText() {
      try {
        const res = await getSupportPageTextContent();
        if (!cancelled && res?.document) {
          setContent(res.document);
          if (Array.isArray(res.document.reasons) && res.document.reasons[0]?.value) {
            setReason((current) => {
              const hasCurrent = res.document.reasons.some((item) => item.value === current);
              return hasCurrent ? current : res.document.reasons[0].value;
            });
          }
        }
      } catch {
        if (!cancelled) {
          setContent(defaultSupportPageTextDocument);
        }
      }
    }

    loadSupportText();
    return () => {
      cancelled = true;
    };
  }, []);

  const isDetailsRequired = reason === "other";
  const remainingCharacters = useMemo(() => 2000 - details.length, [details.length]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (isDetailsRequired && !details.trim()) {
      setError("Please provide more details when selecting Other.");
      return;
    }

    setSubmitting(true);
    try {
      await submitSupportRequest({
        reason,
        details: details.trim(),
      });
      navigate("/profile/help", { state: { submitted: true } });
    } catch (err) {
      setError(err.message || "Failed to submit complaint. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen font-display">
      <div className="relative flex h-auto min-h-screen w-full max-w-md mx-auto flex-col bg-background-light dark:bg-background-dark overflow-x-hidden">
        <div className="flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-10 border-b border-primary/10">
          <button
            type="button"
            aria-label="Go back"
            onClick={() => navigate(-1)}
            className="text-slate-900 dark:text-slate-100 flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-primary/10 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
            Submit a Complaint
          </h2>
          <div className="size-12" />
        </div>

        <div className="px-4 pt-6 pb-2">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-primary text-4xl">support_agent</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {content.heroTitle}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {content.heroDescription}
          </p>
        </div>

        <form className="flex flex-col gap-6 p-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-slate-900 dark:text-slate-100 text-base font-semibold leading-normal pb-4">
              {content.reasonTitle}
            </label>
            <div className="grid grid-cols-1 gap-3">
              {(content.reasons || []).map((item) => (
                <label
                  key={item.value}
                  className="flex items-center p-4 bg-white dark:bg-slate-800 border border-primary/20 rounded-xl cursor-pointer hover:bg-primary/5 transition-colors"
                >
                  <input
                    className="w-5 h-5 text-primary border-primary/20 focus:ring-primary focus:ring-offset-0 bg-transparent"
                    name="reason"
                    type="radio"
                    value={item.value}
                    checked={reason === item.value}
                    onChange={(event) => setReason(event.target.value)}
                  />
                  <span className="ml-3 text-slate-900 dark:text-slate-100 font-medium">
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-900 dark:text-slate-100 text-base font-semibold leading-normal pb-2">
              {content.detailsLabel}
            </label>
            <textarea
              className="w-full rounded-xl text-slate-900 dark:text-slate-100 focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-primary/20 bg-white dark:bg-slate-800 min-h-[160px] p-4 text-base font-normal leading-normal placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
              placeholder={content.detailsPlaceholder}
              value={details}
              onChange={(event) => setDetails(event.target.value.slice(0, 2000))}
            />
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                {isDetailsRequired ? content.detailsRequiredHint : content.detailsOptionalHint}
              </span>
              <span className="text-slate-400 dark:text-slate-500">
                {remainingCharacters} characters left
              </span>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="flex-grow min-h-[40px]" />

          <div className="pb-8">
            <button
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              type="submit"
              disabled={submitting}
            >
              <span className="material-symbols-outlined">send</span>
              {submitting ? content.submittingLabel : content.submitLabel}
            </button>
            <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4 px-6">
              {content.footerNote}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
