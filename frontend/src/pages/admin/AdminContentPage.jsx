import { useCallback, useEffect, useMemo, useState } from "react";
import { adminGetContent, adminUpdateContent } from "../../api/adminClient";
import { contentEditorOptions, defaultContentDocuments } from "../../content/contentRegistry";

function formatDateTime(value) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never";
  return date.toLocaleString();
}

export function AdminContentPage() {
  const [selectedKey, setSelectedKey] = useState(contentEditorOptions[0].key);
  const currentOption = useMemo(
    () => contentEditorOptions.find((option) => option.key === selectedKey) || contentEditorOptions[0],
    [selectedKey]
  );
  const defaultJson = useMemo(
    () => JSON.stringify(defaultContentDocuments[selectedKey], null, 2),
    [selectedKey]
  );
  const [jsonValue, setJsonValue] = useState(defaultJson);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [meta, setMeta] = useState({
    updatedAt: null,
    updatedBy: null,
    source: "default",
  });

  const loadContent = useCallback(async (contentKey) => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await adminGetContent(contentKey);
      setJsonValue(JSON.stringify(res.document || defaultContentDocuments[contentKey], null, 2));
      setMeta({
        updatedAt: res.updatedAt ?? null,
        updatedBy: res.updatedBy ?? null,
        source: res.source || "default",
      });
    } catch (err) {
      setError(err.message || `Failed to load ${currentOption.label.toLowerCase()}.`);
    } finally {
      setLoading(false);
    }
  }, [currentOption.label]);

  useEffect(() => {
    loadContent(selectedKey);
  }, [loadContent, selectedKey]);

  const handleReset = () => {
    setJsonValue(defaultJson);
    setSuccess(null);
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const parsed = JSON.parse(jsonValue);
      const res = await adminUpdateContent(selectedKey, parsed);
      setJsonValue(JSON.stringify(res.document || parsed, null, 2));
      setMeta({
        updatedAt: res.updatedAt ?? null,
        updatedBy: res.updatedBy ?? null,
        source: res.source || "database",
      });
      setSuccess(`${currentOption.label} updated successfully.`);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError(`JSON format error: ${err.message}`);
      } else {
        setError(err.message || `Failed to save ${currentOption.label.toLowerCase()}.`);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-500 dark:text-slate-400">Loading content editor…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Content Manager
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Choose a content type, edit its JSON, and save to publish changes in the app.
            </p>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            <p>Source: {meta.source}</p>
            <p>Last saved: {formatDateTime(meta.updatedAt)}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {contentEditorOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => setSelectedKey(option.key)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                selectedKey === option.key
                  ? "border-uw-primary bg-uw-primary/5 dark:bg-uw-primary/10"
                  : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/50"
              }`}
            >
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{option.label}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {option.description}
              </p>
            </button>
          ))}
        </div>
        <div className="rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 p-4 text-xs text-slate-600 dark:text-slate-300">
          Editing: <code>{currentOption.label}</code>.
          Keep the JSON valid and preserve the top-level fields shown in the current document template.
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-900/20 border border-red-800 p-4 text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-emerald-900/20 border border-emerald-800 p-4 text-emerald-300">
          {success}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 space-y-4">
        <label className="block">
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            {currentOption.label} JSON
          </span>
          <textarea
            value={jsonValue}
            onChange={(event) => setJsonValue(event.target.value)}
            spellCheck={false}
            className="mt-3 min-h-[480px] w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-4 font-mono text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-uw-primary/40"
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-uw-primary text-white px-5 py-3 text-sm font-semibold hover:bg-uw-primary/90 disabled:opacity-60"
          >
            {saving ? "Saving..." : `Save ${currentOption.label}`}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="rounded-xl border border-slate-200 dark:border-slate-700 px-5 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/50 disabled:opacity-60"
          >
            Reset to Default Template
          </button>
          <button
            type="button"
            onClick={() => loadContent(selectedKey)}
            disabled={saving}
            className="rounded-xl border border-slate-200 dark:border-slate-700 px-5 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/50 disabled:opacity-60"
          >
            Reload Saved Version
          </button>
        </div>
      </div>
    </div>
  );
}
