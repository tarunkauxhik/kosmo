"use client";

import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const MAX_BYTES = 8 * 1024 * 1024;

// Uploads a profile photo straight to Convex storage and keeps a local preview.
export function usePhotoUpload(initialUrl: string | null = null) {
    const generateUploadUrl = useMutation(api.user.generateProfileUploadUrl);
    const [storageId, setStorageId] = useState<Id<"_storage"> | null>(null);
    const [preview, setPreview] = useState<string | null>(initialUrl);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        return () => {
            if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    async function upload(file: File) {
        if (!file.type.startsWith("image/")) return setError("Choose an image file (JPG, PNG or WebP).");
        if (file.size > MAX_BYTES) return setError("That image is over 8 MB. Choose a smaller one.");
        setError(null);
        setUploading(true);
        setPreview(URL.createObjectURL(file));
        try {
            const url = await generateUploadUrl();
            const res = await fetch(url, { method: "POST", headers: { "Content-Type": file.type }, body: file });
            if (!res.ok) throw new Error(`upload failed: ${res.status}`);
            const { storageId } = (await res.json()) as { storageId: Id<"_storage"> };
            setStorageId(storageId);
        } catch {
            setError("The upload didn't go through. Check your connection and try again.");
            setPreview(initialUrl);
            setStorageId(null);
        } finally {
            setUploading(false);
        }
    }

    return { storageId, preview, uploading, error, upload };
}
