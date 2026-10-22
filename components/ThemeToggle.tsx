"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { setThemePref, useThemePref, type ThemePref } from "@/lib/theme";
import { cn } from "@/lib/utils";

const OPTIONS: { value: ThemePref; label: string; Icon: typeof Sun }[] = [
    { value: "system", label: "System theme", Icon: Monitor },
    { value: "light", label: "Light theme", Icon: Sun },
    { value: "dark", label: "Dark theme", Icon: Moon },
];

// Three-way segmented control. Renders unselected on the server, then picks up the saved choice.
export function ThemeToggle({ className }: { className?: string }) {
    const pref = useThemePref();
    return (
        <div
            role="radiogroup"
            aria-label="Theme"
            className={cn("inline-flex rounded-full p-0.5 shadow-surface", className)}
        >
            {OPTIONS.map(({ value, label, Icon }) => {
                const active = pref === value;
                return (
                    <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        aria-label={label}
                        title={label}
                        onClick={() => setThemePref(value)}
                        className={cn(
                            "relative grid size-7 place-items-center rounded-full text-muted-foreground transition-[color,background-color] duration-150 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                            "after:absolute after:-inset-1 after:content-['']",
                            active && "bg-muted text-foreground",
                        )}
                    >
                        <Icon className="size-3.5" strokeWidth={1.75} aria-hidden />
                    </button>
                );
            })}
        </div>
    );
}
