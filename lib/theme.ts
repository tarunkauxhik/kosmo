"use client";

import { useSyncExternalStore } from "react";

// Theme preference: "system" follows the OS; "light"/"dark" are saved choices.
// The inline script in app/layout.tsx applies it before first paint; this keeps it in sync after.
export type ThemePref = "system" | "light" | "dark";

const KEY = "theme";
const listeners = new Set<() => void>();
const media = () => window.matchMedia("(prefers-color-scheme: dark)");

function readPref(): ThemePref {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
}

function apply(pref: ThemePref) {
    const dark = pref === "dark" || (pref === "system" && media().matches);
    const root = document.documentElement;
    // Switch colours in one frame rather than letting every transition animate.
    root.classList.add("theme-switching");
    root.classList.toggle("dark", dark);
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("theme-switching")));
}

export function setThemePref(pref: ThemePref) {
    if (pref === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, pref);
    apply(pref);
    listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    const onSystem = () => {
        if (readPref() === "system") apply("system");
        listener();
    };
    const mq = media();
    mq.addEventListener("change", onSystem);
    window.addEventListener("storage", onSystem);
    return () => {
        listeners.delete(listener);
        mq.removeEventListener("change", onSystem);
        window.removeEventListener("storage", onSystem);
    };
}

/** The saved preference, or null during server rendering. */
export function useThemePref(): ThemePref | null {
    return useSyncExternalStore(subscribe, readPref, () => null);
}

/** The theme actually showing, or null during server rendering. */
export function useResolvedTheme(): "light" | "dark" | null {
    return useSyncExternalStore(
        subscribe,
        () => (document.documentElement.classList.contains("dark") ? "dark" : "light"),
        () => null,
    );
}
