import { getTermsContent } from "../api/contentClient";
import { defaultTermsDocument } from "../content/contentRegistry";
import { PolicyDocumentPage } from "../components/content/PolicyDocumentPage";

export function TermsPage() {
  return (
    <PolicyDocumentPage
      pageTitle="Terms and Conditions"
      loadingLabel="Loading terms..."
      defaultDocument={defaultTermsDocument}
      loadContent={getTermsContent}
    />
  );
}
