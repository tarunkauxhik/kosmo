import { pageMetadata } from "@/lib/seo";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata = pageMetadata({
    title: "Privacy Policy",
    description: "What Kosmo stores about you, how birth details and conversations are used, and who can see them.",
    path: "/privacy",
});

export default function Page() {
    return <LegalPage kind="privacy" />;
}
