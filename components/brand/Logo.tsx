import { cn } from "@/lib/utils";

// Kosmo mark: a ring (the "o" of kosmo, a planet) with one small moon in the accent colour.
// Same geometry as app/icon.svg; inherits the text colour so it works in both themes.
function LogoMark({ className, title }: { className?: string; title?: string }) {
    return (
        <svg
            viewBox="0 0 32 32"
            className={cn("size-6", className)}
            role={title ? "img" : undefined}
            aria-label={title}
            aria-hidden={title ? undefined : true}
        >
            <circle cx="15" cy="17" r="9.5" fill="none" stroke="currentColor" strokeWidth="4" />
            <circle cx="26.5" cy="5.5" r="3.5" className="fill-brand" />
        </svg>
    );
}

export function Wordmark({ className }: { className?: string }) {
    return (
        <span className={cn("inline-flex items-center gap-2 text-foreground", className)}>
            <LogoMark className="size-[1.375rem]" />
            <span translate="no" className="text-[1.0625rem] leading-none font-semibold tracking-[-0.03em]">
                kosmo
            </span>
        </span>
    );
}
