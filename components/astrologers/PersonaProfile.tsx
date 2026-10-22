import Link from "next/link";
import { ArrowLeft, Info, MessageCircle, Phone } from "lucide-react";
import { AiBadge } from "@/components/AiBadge";
import { PersonaAvatar } from "@/components/PersonaAvatar";
import { Button } from "@/components/ui/button";
import { firstName } from "@/lib/format";

export type Persona = {
    slug: string;
    name: string;
    portrait: string;
    specialties: string[];
    languages: string[];
    tagline?: string;
    bio?: string;
    signature?: string;
    hometown?: string;
    region?: string;
};

// A persona's profile, shared by the public page (/astrologers/[slug]) and the in-app page.
export function PersonaProfile({ c, back }: { c: Persona; back: { href: string; label: string } }) {
    const first = firstName(c.name);
    return (
        <div className="mx-auto w-full max-w-5xl px-5 py-6 lg:px-8 lg:py-10">
            <Button asChild variant="ghost" size="sm" className="-ml-2.5 pr-3 pl-2 text-muted-foreground">
                <Link href={back.href}>
                    <ArrowLeft aria-hidden /> {back.label}
                </Link>
            </Button>

            <div className="mt-4 grid gap-10 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-14">
                <aside className="lg:sticky lg:top-24 lg:self-start">
                    <div className="flex items-center gap-5 lg:flex-col lg:items-start">
                        <PersonaAvatar
                            src={c.portrait}
                            name={c.name}
                            sizes="(min-width: 1024px) 176px, 120px"
                            eager
                            className="size-30 lg:size-44"
                        />
                        <div className="min-w-0">
                            <h1 className="text-2xl leading-tight font-semibold tracking-tight sm:text-[1.75rem]">
                                {c.name}
                            </h1>
                            <p className="mt-1 text-muted-foreground">{c.hometown ?? c.region}</p>
                            <div className="mt-3">
                                <AiBadge />
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 grid grid-cols-2 gap-2 lg:grid-cols-1">
                        <Button asChild size="lg">
                            <Link href={`/dashboard/call/${c.slug}`}>
                                <Phone aria-hidden />
                                <span>
                                    Call<span className="max-lg:sr-only"> {first}</span>
                                </span>
                            </Link>
                        </Button>
                        <Button asChild size="lg" variant="outline">
                            <Link href={`/dashboard/chat?counsellor=${c.slug}`}>
                                <MessageCircle aria-hidden />
                                <span>
                                    Chat<span className="max-lg:sr-only"> with {first}</span>
                                </span>
                            </Link>
                        </Button>
                    </div>
                    <p className="mt-4 flex gap-2 text-sm leading-relaxed text-muted-foreground">
                        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
                        {first} is an AI persona, not a real astrologer. Replies are generated, so treat them as
                        reflection, not medical, legal or financial advice.
                    </p>
                </aside>

                <div className="min-w-0 space-y-10">
                    {c.tagline && (
                        <p className="text-xl leading-snug font-medium tracking-tight sm:text-2xl">{c.tagline}</p>
                    )}

                    {c.bio && (
                        <section aria-labelledby="about-h">
                            <h2 id="about-h" className="text-sm font-medium text-muted-foreground">
                                About {first}
                            </h2>
                            <p className="mt-3 max-w-prose text-[1.0625rem] leading-relaxed">{c.bio}</p>
                        </section>
                    )}

                    <dl className="grid gap-6 border-y py-6 sm:grid-cols-2">
                        <div>
                            <dt className="text-sm font-medium text-muted-foreground">Traditions</dt>
                            <dd className="mt-2 flex flex-wrap gap-2">
                                {c.specialties.map((s) => (
                                    <span key={s} className="rounded-full px-3 py-1 text-sm shadow-surface">
                                        {s}
                                    </span>
                                ))}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-muted-foreground">Speaks</dt>
                            <dd className="mt-2">{c.languages.join(", ")}</dd>
                        </div>
                    </dl>

                    {c.signature && (
                        <figure>
                            <blockquote className="border-l-2 border-brand pl-5 text-lg leading-relaxed">
                                &ldquo;{c.signature}&rdquo;
                            </blockquote>
                            <figcaption className="mt-2 pl-5 text-sm text-muted-foreground">
                                Something {first} likes to say
                            </figcaption>
                        </figure>
                    )}
                </div>
            </div>
        </div>
    );
}
