import { getPrivacyPolicyContent } from "../api/contentClient";
import { defaultPrivacyPolicyDocument } from "../content/contentRegistry";
import { PolicyDocumentPage } from "../components/content/PolicyDocumentPage";

export function PrivacyPolicyPage() {
  return (
    <PolicyDocumentPage
      pageTitle="Privacy Policy"
      loadingLabel="Loading privacy policy..."
      defaultDocument={defaultPrivacyPolicyDocument}
      loadContent={getPrivacyPolicyContent}
    />
  );
}
