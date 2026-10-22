"use client";

import { formatClock, formatFull, formatRelativeDay } from "@/lib/format";

const FORMATS = { clock: formatClock, full: formatFull, relative: (ts: number) => formatRelativeDay(ts) };

// Renders a timestamp in the reader's own time zone. The server pass may use a different
// zone, so the client value replaces it on hydration.
export function LocalTime({
    ts,
    format = "relative",
    className,
}: {
    ts: number;
    format?: keyof typeof FORMATS;
    className?: string;
}) {
    return (
        <time dateTime={new Date(ts).toISOString()} className={className} suppressHydrationWarning>
            {FORMATS[format](ts)}
        </time>
    );
}
