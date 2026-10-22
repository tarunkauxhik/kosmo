const timeFmt = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" });
const dayFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });
const weekdayFmt = new Intl.DateTimeFormat("en-IN", { weekday: "short" });
const fullFmt = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
});

export function formatClock(ts: number) {
    return timeFmt.format(ts);
}

export function formatFull(ts: number) {
    return fullFmt.format(ts);
}

// "4:05 pm" today, "Yesterday", weekday within a week, else "12 Oct".
export function formatRelativeDay(ts: number, now = Date.now()) {
    const d = new Date(ts);
    const today = new Date(now);
    if (d.toDateString() === today.toDateString()) return timeFmt.format(d);
    const yesterday = new Date(now);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    if (now - ts < 6 * 86_400_000) return weekdayFmt.format(d);
    return dayFmt.format(d);
}

export function formatDuration(sec?: number) {
    if (!sec || sec <= 0) return null;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s}s`;
    return s === 0 ? `${m} min` : `${m} min ${s}s`;
}

export function firstName(name: string) {
    const parts = name.trim().split(/\s+/);
    // Skip honorifics such as "Pt." or "Dr." when greeting someone.
    const first = parts[0]?.endsWith(".") && parts.length > 1 ? parts[1] : parts[0];
    return first || name;
}
