"use client";

import { useRef } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { UserAvatar } from "@/components/shell/UserAvatar";

export function PhotoPicker({
    name,
    preview,
    uploading,
    error,
    onPick,
}: {
    name: string;
    preview: string | null;
    uploading: boolean;
    error: string | null;
    onPick: (file: File) => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    return (
        <div className="flex items-center gap-4">
            <div className="relative">
                <UserAvatar name={name || "?"} imageUrl={preview} className="size-16 text-xl" />
                {uploading && (
                    <span className="absolute inset-0 grid place-items-center rounded-full bg-background/60">
                        <Spinner />
                    </span>
                )}
            </div>
            <div className="space-y-1">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => inputRef.current?.click()}
                    disabled={uploading}
                >
                    <Camera aria-hidden /> {preview ? "Change photo" : "Add a photo"}
                </Button>
                <p className="text-xs text-muted-foreground">Optional. JPG, PNG or WebP, up to 8 MB.</p>
                {error && (
                    <p role="alert" className="text-sm text-destructive">
                        {error}
                    </p>
                )}
            </div>
            <input
                ref={inputRef}
                type="file"
                name="photo"
                accept="image/*"
                className="sr-only"
                tabIndex={-1}
                aria-hidden
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) onPick(file);
                }}
            />
        </div>
    );
}
