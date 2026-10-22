import { pageMetadata } from "@/lib/seo";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata = pageMetadata({
    title: "About",
    description: "What Kosmo is, who the AI astrologer personas are, and how replies are generated.",
    path: "/about",
});

export default function Page() {
    return <LegalPage kind="about" />;
}
