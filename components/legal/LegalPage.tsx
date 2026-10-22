import { LEGAL_TITLES, LEGAL_UPDATED, LegalContent, type LegalKind } from "./LegalContent";

export function LegalPage({ kind }: { kind: LegalKind }) {
    return (
        <article className="mx-auto w-full max-w-2xl px-5 py-12 sm:py-16">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{LEGAL_TITLES[kind]}</h1>
            <p className="mt-3 text-sm text-muted-foreground tabular-nums">Last updated {LEGAL_UPDATED}</p>
            <LegalContent kind={kind} className="mt-10" />
        </article>
    );
}
