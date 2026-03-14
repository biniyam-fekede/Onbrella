import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export function PolicyDocumentPage({
  pageTitle,
  loadingLabel,
  defaultDocument,
  loadContent,
}) {
  const navigate = useNavigate();
  const [document, setDocument] = useState(defaultDocument);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await loadContent();
        if (!cancelled && res?.document) {
          setDocument(res.document);
        }
      } catch {
        if (!cancelled) {
          setDocument(defaultDocument);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [defaultDocument, loadContent]);

  const renderSection = (section) => {
    const isHighlight = section.variant === "highlight";
    const isPricing = section.variant === "pricing";
    const sectionClassName = isHighlight
      ? "bg-primary/5 dark:bg-primary/10 p-5 rounded-xl border border-primary/20"
      : "";

    return (
      <section key={section.id || `${section.number}-${section.title}`} className={sectionClassName}>
        <h3 className="text-slate-900 dark:text-slate-100 text-xl font-bold mb-3 flex items-center gap-2">
          <span className="text-primary">{section.number}</span> {section.title}
        </h3>
        <div className="space-y-3 text-slate-700 dark:text-slate-300 leading-relaxed">
          {(section.paragraphs || []).map((paragraph, index) => (
            <p key={`${section.id || section.title}-paragraph-${index}`}>{paragraph}</p>
          ))}

          {Array.isArray(section.bullets) && section.bullets.length > 0 && (
            <ul className="list-disc pl-5 space-y-2">
              {section.bullets.map((item, index) => (
                <li key={`${section.id || section.title}-bullet-${index}`}>{item}</li>
              ))}
            </ul>
          )}

          {Array.isArray(section.checklist) && section.checklist.length > 0 && (
            <ul className="list-none space-y-3">
              {section.checklist.map((item, index) => (
                <li key={`${section.id || section.title}-check-${index}`} className="flex gap-3">
                  <span className="material-symbols-outlined text-primary shrink-0">
                    check_circle
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}

          {isPricing && Array.isArray(section.cards) && section.cards.length > 0 && (
            <div className="space-y-4">
              {section.cards.map((card, index) => (
                <div
                  key={`${section.id || section.title}-card-${index}`}
                  className={`flex justify-between items-center p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm ${
                    card.tone === "danger" ? "border-l-4 border-red-500" : ""
                  }`}
                >
                  <span>{card.label}</span>
                  <span
                    className={`font-bold ${
                      card.tone === "danger"
                        ? "text-red-500"
                        : "text-slate-900 dark:text-slate-100"
                    }`}
                  >
                    {card.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {section.note && (
            <p className="text-sm italic text-slate-500">{section.note}</p>
          )}
        </div>
      </section>
    );
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen">
      <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden">
        <div className="flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-primary flex size-12 shrink-0 items-center justify-start cursor-pointer"
            aria-label="Go back"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-[-0.015em] flex-1">
            {pageTitle}
          </h2>
          <div className="size-12" />
        </div>

        <div className="px-4 pt-8 pb-4">
          <h1 className="text-slate-900 dark:text-slate-100 tracking-tight text-[32px] font-bold leading-tight text-left">
            {document.title}
          </h1>
          <p className="text-primary text-sm font-medium leading-normal pt-2">
            {document.lastUpdatedLabel}
          </p>
          <p className="text-slate-600 dark:text-slate-400 text-base font-normal leading-relaxed pt-4">
            {document.intro}
          </p>
        </div>

        <div className="flex flex-col gap-8 px-4 py-6">
          {loading ? (
            <div className="py-10 text-center text-slate-500 dark:text-slate-400">
              {loadingLabel}
            </div>
          ) : (
            (document.sections || []).map(renderSection)
          )}
        </div>
      </div>
    </div>
  );
}
