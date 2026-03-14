import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getHelpFaqContent, getSupportPageTextContent } from "../api/contentClient";
import {
  defaultHelpFaqDocument,
  defaultSupportPageTextDocument,
} from "../content/contentRegistry";

export function HelpSupportPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const submissionSucceeded = Boolean(location.state?.submitted);
  const [document, setDocument] = useState(defaultHelpFaqDocument);
  const [supportText, setSupportText] = useState(defaultSupportPageTextDocument);

  useEffect(() => {
    let cancelled = false;

    async function loadHelpContent() {
      try {
        const [faqRes, supportRes] = await Promise.all([
          getHelpFaqContent().catch(() => null),
          getSupportPageTextContent().catch(() => null),
        ]);
        if (!cancelled && faqRes?.document) {
          setDocument(faqRes.document);
        }
        if (!cancelled && supportRes?.document) {
          setSupportText(supportRes.document);
        }
      } catch {
        if (!cancelled) {
          setDocument(defaultHelpFaqDocument);
          setSupportText(defaultSupportPageTextDocument);
        }
      }
    }

    loadHelpContent();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100">
      <div className="relative flex min-h-screen w-full max-w-md mx-auto flex-col bg-background-light dark:bg-background-dark overflow-x-hidden">
        <div className="flex items-center p-4 pb-2 justify-between">
          <button
            type="button"
            aria-label="Go back"
            onClick={() => navigate(-1)}
            className="text-slate-900 dark:text-slate-100 flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h2 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10">
            {document.title}
          </h2>
        </div>

        {submissionSucceeded && (
          <div className="px-4 pt-3">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-900/20 p-4 text-sm text-emerald-700 dark:text-emerald-300">
              {supportText.successMessage}
            </div>
          </div>
        )}

        <div className="flex flex-col px-4 pt-4">
          <h2 className="text-xl font-bold leading-tight tracking-tight pb-4">
            {document.faqTitle}
          </h2>
          {document.intro && (
            <p className="text-sm text-slate-500 dark:text-slate-400 pb-4">
              {document.intro}
            </p>
          )}
          <div className="flex flex-col space-y-1">
            {(document.faqs || []).map((item, index) => (
              <details
                key={item.question}
                className="group border-b border-slate-100 dark:border-slate-800 py-3"
                open={index === 0}
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 list-none">
                  <p className="text-sm font-semibold leading-normal">{item.question}</p>
                  <span className="material-symbols-outlined text-primary group-open:rotate-180 transition-transform">
                    expand_more
                  </span>
                </summary>
                <div className="mt-3 text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </div>

        <div className="px-4 py-8 flex flex-col gap-4">
          <div className="bg-primary/10 dark:bg-primary/5 rounded-xl p-6 flex flex-col items-center text-center gap-4">
            <div className="bg-primary text-white p-3 rounded-full">
              <span className="material-symbols-outlined text-3xl">headset_mic</span>
            </div>
            <div>
              <h3 className="font-bold text-lg">{document.supportCard?.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                {document.supportCard?.description}
              </p>
            </div>
            <Link
              to="/profile/help/complaint"
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">report_problem</span>
              {document.supportCard?.buttonLabel}
            </Link>
          </div>
        </div>

        <div className="px-4 pb-10">
          <div className="space-y-3">
            {(document.legalLinks || []).map((item) => (
              <Link
                key={item.path}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl group"
                to={item.path}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-400">description</span>
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
                <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">
                  chevron_right
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
