"use client";

import { useEffect, useState } from "react";

export function CallTimer({ startedAt }: { startedAt: number }) {
    const [now, setNow] = useState(startedAt);
    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, []);
    const sec = Math.max(0, Math.floor((now - startedAt) / 1000));
    return (
        <span className="tabular-nums">
            {Math.floor(sec / 60)}:{String(sec % 60).padStart(2, "0")}
        </span>
    );
}
