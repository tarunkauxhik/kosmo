import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import { AiBadge } from "@/components/AiBadge";
import { PersonaAvatar } from "@/components/PersonaAvatar";
import { Button } from "@/components/ui/button";
import { appConfig } from "@/lib/config";
import { SEED_COUNSELLORS } from "@/lib/constants";
import { jsonLd, pageMetadata } from "@/lib/seo";

const STEPS = [
    {
        title: "Choose an astrologer",
        body: "Each persona has a tradition, a region and a way of talking. Vedic, KP, tarot, numerology, vastu.",
    },
    {
        title: "Share your birth details",
        body: "Date, time if you know it, and place. You enter them once and every astrologer can use them.",
    },
    {
        title: "Call or chat",
        body: "Talk out loud on a live call, or type and send voice notes. Replies come back in English or Hinglish.",
    },
];

const FEATURED = ["pratyuksha", "devrajit", "prarthna", "rohan", "siya", "amit"];

export const metadata = pageMetadata({ path: "/" });

const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "Organization",
            "@id": `${appConfig.url}/#organization`,
            name: appConfig.name,
            url: appConfig.url,
            logo: `${appConfig.url}/icon.png`,
        },
        {
            "@type": "WebSite",
            "@id": `${appConfig.url}/#website`,
            name: appConfig.name,
            url: appConfig.url,
            description: appConfig.description,
            inLanguage: "en-IN",
            publisher: { "@id": `${appConfig.url}/#organization` },
        },
    ],
};

// Prerendered. Signed-in visitors who press a CTA are sent into the app by proxy.ts.
export default function LandingPage() {
    const featured = FEATURED.map((slug) => SEED_COUNSELLORS.find((c) => c.slug === slug)).filter(
        (c) => c !== undefined,
    );
    const preview = featured[0];

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(structuredData)} />

            <section className="relative isolate overflow-hidden">
                {/* The one cosmic touch: a faint star field and a soft iris glow behind the hero. */}
                <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
                    <div className="absolute inset-0 bg-[radial-gradient(var(--foreground)_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.07] [mask-image:radial-gradient(ellipse_60%_55%_at_50%_30%,black,transparent)]" />
                    <div className="absolute top-[38%] left-1/2 h-[28rem] w-[56rem] max-w-[140vw] -translate-x-1/2 rounded-full bg-brand/15 blur-[120px] dark:bg-brand/10" />
                </div>

                <div className="mx-auto w-full max-w-6xl px-5 pt-16 pb-20 text-center sm:pt-24 md:pb-28">
                    {/* No entrance animation on the headline: it is the LCP element. */}
                    <h1 className="mx-auto max-w-3xl text-[2.5rem] leading-[1.05] font-semibold tracking-[-0.035em] sm:text-6xl">
                        Talk through your chart with an AI astrologer
                    </h1>
                    <p className="animate-enter mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
                        Pick one of {SEED_COUNSELLORS.length} AI personas, share your birth details once, then call or
                        chat about marriage, money, health or work.
                    </p>
                    <div className="animate-enter mx-auto mt-8 flex max-w-xs flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
                        <Button asChild size="lg">
                            <Link href="/sign-up">Create a free account</Link>
                        </Button>
                        <Button asChild size="lg" variant="outline" className="has-[svg]:pr-4">
                            <Link href="/astrologers">
                                Meet the astrologers <ArrowRight aria-hidden className="text-muted-foreground" />
                            </Link>
                        </Button>
                    </div>
                    <p className="animate-enter mt-5 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <span className="size-1.5 rounded-full bg-brand" aria-hidden />
                        Every astrologer here is a labelled AI persona.
                    </p>

                    {preview && (
                        <figure className="animate-enter mx-auto mt-14 max-w-3xl text-left sm:mt-16">
                            {/* Concentric frame: outer 24px = inner 16px + 8px padding. */}
                            <div className="rounded-3xl bg-card/60 p-2 shadow-raised backdrop-blur-sm">
                                <div className="overflow-hidden rounded-2xl bg-card shadow-surface">
                                    <div className="flex items-center gap-3 border-b px-4 py-3">
                                        <PersonaAvatar src={preview.portrait} name={preview.name} size={36} />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">{preview.name}</p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {preview.specialties.join(", ")}
                                            </p>
                                        </div>
                                        <AiBadge className="hidden sm:inline-flex" />
                                        <span className="flex h-8 items-center gap-1.5 rounded-full bg-success/10 px-3 text-xs font-medium text-success tabular-nums">
                                            <Phone className="size-3.5" aria-hidden /> 02:14
                                        </span>
                                    </div>
                                    <div className="space-y-4 px-4 py-5 text-[0.9375rem] leading-relaxed sm:px-6">
                                        <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-muted px-4 py-2.5">
                                            I feel stuck at work. Is this a Saturn thing?
                                        </p>
                                        <p className="max-w-[92%]">
                                            Saturn is moving through your tenth house, so it can feel slow, but it
                                            rewards steady work. Give it until March before you decide on a switch.
                                        </p>
                                        <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-muted px-4 py-2.5">
                                            And if an offer comes before that?
                                        </p>
                                        <span className="flex h-6 items-center gap-1" aria-hidden>
                                            {[0, 1, 2].map((i) => (
                                                <span
                                                    key={i}
                                                    className="size-1.5 rounded-full bg-muted-foreground"
                                                    style={{
                                                        animation: `typing 1.2s ${i * 0.15}s ease-in-out infinite`,
                                                    }}
                                                />
                                            ))}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <figcaption className="sr-only">
                                Example of a chat with {preview.name}, an AI astrologer persona, during a call.
                            </figcaption>
                        </figure>
                    )}
                </div>
            </section>

            <section aria-labelledby="how" className="border-t">
                <div className="mx-auto w-full max-w-6xl px-5 py-20 md:py-24">
                    <h2 id="how" className="text-2xl font-semibold tracking-tight sm:text-3xl">
                        How it works
                    </h2>
                    <ol className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
                        {STEPS.map((step, i) => (
                            <li key={step.title} className="flex gap-4 md:block">
                                <span
                                    className="grid size-8 shrink-0 place-items-center rounded-full text-sm font-medium tabular-nums shadow-surface"
                                    aria-hidden
                                >
                                    {i + 1}
                                </span>
                                <div className="md:mt-5">
                                    <h3 className="font-medium">{step.title}</h3>
                                    <p className="mt-1.5 leading-relaxed text-muted-foreground">{step.body}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            <section aria-labelledby="meet" className="border-t">
                <div className="mx-auto w-full max-w-6xl px-5 py-20 md:py-24">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <h2 id="meet" className="text-2xl font-semibold tracking-tight sm:text-3xl">
                            A few of the personas
                        </h2>
                        <Link
                            href="/astrologers"
                            className="inline-flex items-center gap-1 text-sm font-medium text-brand underline-offset-4 hover:underline"
                        >
                            See all {SEED_COUNSELLORS.length} astrologers{" "}
                            <ArrowRight className="size-3.5" aria-hidden />
                        </Link>
                    </div>
                    <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                        {featured.map((c) => (
                            <li
                                key={c.slug}
                                className="group relative flex flex-col rounded-2xl bg-card p-4 shadow-surface transition-shadow duration-150 hover:shadow-surface-hover"
                            >
                                <PersonaAvatar src={c.portrait} name={c.name} size={48} />
                                <h3 className="mt-4 text-sm leading-snug font-medium">
                                    <Link
                                        href={`/astrologers/${c.slug}`}
                                        className="outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-ring"
                                    >
                                        {c.name}
                                    </Link>
                                </h3>
                                <p className="mt-1 text-[0.8125rem] text-muted-foreground">{c.specialties[0]}</p>
                                <p className="text-[0.8125rem] text-muted-foreground">{c.hometown}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            <section aria-labelledby="honest" className="border-t">
                <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-20 md:grid-cols-[1fr_1.4fr] md:py-24">
                    <h2 id="honest" className="text-2xl font-semibold tracking-tight sm:text-3xl">
                        What to expect
                    </h2>
                    <dl className="divide-y border-y">
                        <div className="py-5">
                            <dt className="font-medium">The astrologers are AI</dt>
                            <dd className="mt-1 text-muted-foreground">
                                Personas, portraits and voices are generated. If you ask, they will tell you they are an
                                AI.
                            </dd>
                        </div>
                        <div className="py-5">
                            <dt className="font-medium">Your conversations are private</dt>
                            <dd className="mt-1 text-muted-foreground">
                                Chats and call transcripts are tied to your account and are never shown to other people.
                            </dd>
                        </div>
                        <div className="py-5">
                            <dt className="font-medium">It is for reflection</dt>
                            <dd className="mt-1 text-muted-foreground">
                                For health, legal or money decisions, talk to a qualified professional. In a crisis,
                                call a helpline.
                            </dd>
                        </div>
                    </dl>
                </div>
            </section>

            <section aria-labelledby="start" className="border-t">
                <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-5 py-20 text-center md:py-24">
                    <h2 id="start" className="text-2xl font-semibold tracking-tight sm:text-3xl">
                        Start with one question
                    </h2>
                    <p className="mt-3 max-w-md text-muted-foreground">
                        Free to try. Your birth details stay with your account, and you can change them any time.
                    </p>
                    <Button asChild size="lg" className="mt-7">
                        <Link href="/sign-up">Create a free account</Link>
                    </Button>
                </div>
            </section>
        </>
    );
}
