import { pageMetadata } from "@/lib/seo";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata = pageMetadata({
    title: "Terms of Service",
    description: "The terms for using Kosmo, an AI astrology service for reflection, not professional advice.",
    path: "/terms",
});

export default function Page() {
    return <LegalPage kind="terms" />;
}
