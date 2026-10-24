"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { signOut } from "@/lib/auth-client";
import { usePhotoUpload } from "@/hooks/usePhotoUpload";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { FieldError } from "@/components/auth/FieldError";
import { PhotoPicker } from "./PhotoPicker";
import { GenderField, type Gender } from "./GenderField";

type ProfileInitial = {
    displayName: string;
    gender: Gender | null;
    birthDate: string | null;
    birthTime: string | null;
    birthTimeUnknown: boolean;
    birthPlace: string | null;
    profileImageUrl: string | null;
};

type Errors = Partial<Record<"name" | "gender" | "birthDate" | "birthTime" | "birthPlace", string>>;

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
    return (
        <section className="grid gap-6 border-t py-8 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-10">
            <div>
                <h2 className="font-medium">{title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
            <div className="max-w-md space-y-5">{children}</div>
        </section>
    );
}

export function ProfileForm({ email, initial }: { email: string; initial: ProfileInitial }) {
    const router = useRouter();
    const saveProfile = useMutation(api.user.saveProfile);
    const photo = usePhotoUpload(initial.profileImageUrl);
    const [name, setName] = useState(initial.displayName);
    const [gender, setGender] = useState<Gender | null>(initial.gender);
    const [birthDate, setBirthDate] = useState(initial.birthDate ?? "");
    const [birthTime, setBirthTime] = useState(initial.birthTime ?? "");
    const [timeUnknown, setTimeUnknown] = useState(initial.birthTimeUnknown);
    const [birthPlace, setBirthPlace] = useState(initial.birthPlace ?? "");
    const [errors, setErrors] = useState<Errors>({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(initial);
    const [today] = useState(() => new Date().toISOString().slice(0, 10));

    const dirty =
        name !== saved.displayName ||
        gender !== saved.gender ||
        birthDate !== (saved.birthDate ?? "") ||
        birthTime !== (saved.birthTime ?? "") ||
        timeUnknown !== saved.birthTimeUnknown ||
        birthPlace !== (saved.birthPlace ?? "") ||
        photo.storageId !== null;

    // Warn before leaving with unsaved edits.
    useEffect(() => {
        if (!dirty) return;
        const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
        window.addEventListener("beforeunload", onBeforeUnload);
        return () => window.removeEventListener("beforeunload", onBeforeUnload);
    }, [dirty]);

    async function onSubmit(ev: React.FormEvent) {
        ev.preventDefault();
        const e: Errors = {};
        if (!name.trim()) e.name = "Enter a name.";
        if (!gender) e.gender = "Choose one.";
        if (!birthDate) e.birthDate = "Enter your date of birth.";
        else if (birthDate > today) e.birthDate = "That date is in the future.";
        if (!timeUnknown && !birthTime) e.birthTime = "Enter a time, or tick “I don’t know”.";
        if (!birthPlace.trim()) e.birthPlace = "Enter the city you were born in.";
        setErrors(e);
        if (Object.keys(e).length) {
            document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
            return;
        }
        setSaving(true);
        try {
            await saveProfile({
                displayName: name.trim(),
                gender: gender!,
                birthDate,
                birthTime: timeUnknown ? undefined : birthTime,
                birthTimeUnknown: timeUnknown,
                birthPlace: birthPlace.trim(),
                profileImageStorageId: photo.storageId ?? undefined,
            });
            setSaved({
                ...saved,
                displayName: name.trim(),
                gender,
                birthDate,
                birthTime,
                birthTimeUnknown: timeUnknown,
                birthPlace: birthPlace.trim(),
            });
            toast.success("Profile saved");
            router.refresh();
        } catch (err) {
            toast.error(
                err instanceof ConvexError && typeof err.data === "string"
                    ? err.data
                    : "Your changes didn't save. Try again.",
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={onSubmit} noValidate>
            <Section title="Account" description="How you appear to the astrologers.">
                <PhotoPicker
                    name={name}
                    preview={photo.preview}
                    uploading={photo.uploading}
                    error={photo.error}
                    onPick={photo.upload}
                />
                <div className="space-y-2">
                    <Label htmlFor="pf-email">Email</Label>
                    <Input id="pf-email" value={email} readOnly disabled />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="pf-name">Name</Label>
                    <Input
                        id="pf-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                        aria-invalid={!!errors.name}
                        aria-describedby={errors.name ? "pf-name-err" : undefined}
                    />
                    <FieldError id="pf-name-err" message={errors.name} />
                </div>
            </Section>

            <Section
                title="Birth details"
                description="Shared with whichever astrologer you talk to. Never shown to other people."
            >
                <fieldset className="space-y-2">
                    <legend className="text-sm font-medium">Gender</legend>
                    <GenderField
                        value={gender}
                        onChange={setGender}
                        invalid={!!errors.gender}
                        describedBy={errors.gender ? "pf-gender-err" : undefined}
                    />
                    <FieldError id="pf-gender-err" message={errors.gender} />
                </fieldset>
                <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="pf-date">Date of birth</Label>
                        <Input
                            id="pf-date"
                            type="date"
                            value={birthDate}
                            min="1900-01-01"
                            max={today}
                            onChange={(e) => setBirthDate(e.target.value)}
                            aria-invalid={!!errors.birthDate}
                            aria-describedby={errors.birthDate ? "pf-date-err" : undefined}
                        />
                        <FieldError id="pf-date-err" message={errors.birthDate} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pf-time">Time of birth</Label>
                        <Input
                            id="pf-time"
                            type="time"
                            value={birthTime}
                            onChange={(e) => setBirthTime(e.target.value)}
                            disabled={timeUnknown}
                            aria-invalid={!!errors.birthTime}
                            aria-describedby={errors.birthTime ? "pf-time-err" : undefined}
                        />
                        <FieldError id="pf-time-err" message={errors.birthTime} />
                    </div>
                </div>
                <Label htmlFor="pf-unknown" className="flex min-h-11 cursor-pointer items-center gap-3 font-normal">
                    <Checkbox
                        id="pf-unknown"
                        checked={timeUnknown}
                        onCheckedChange={(v) => setTimeUnknown(v === true)}
                    />
                    I don&rsquo;t know my birth time
                </Label>
                <div className="space-y-2">
                    <Label htmlFor="pf-place">Place of birth</Label>
                    <Input
                        id="pf-place"
                        value={birthPlace}
                        onChange={(e) => setBirthPlace(e.target.value)}
                        placeholder="Jaipur, India"
                        aria-invalid={!!errors.birthPlace}
                        aria-describedby={errors.birthPlace ? "pf-place-err" : undefined}
                    />
                    <FieldError id="pf-place-err" message={errors.birthPlace} />
                </div>
            </Section>

            <div className="sticky bottom-16 z-10 -mx-5 flex flex-wrap items-center justify-between gap-3 border-t bg-background/85 px-5 py-4 backdrop-blur-md lg:bottom-0">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button type="button" variant="ghost" className="text-muted-foreground">
                            <LogOut aria-hidden /> Sign out
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Sign out of Kosmo?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Your chats and calls stay saved. Sign in again to see them.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Stay signed in</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={async () => {
                                    await signOut();
                                    router.push("/sign-in");
                                }}
                            >
                                Sign out
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <div className="flex items-center gap-3">
                    {dirty && (
                        <span className="text-sm text-muted-foreground" aria-live="polite">
                            Unsaved changes
                        </span>
                    )}
                    <Button type="submit" disabled={saving || photo.uploading || !dirty}>
                        {saving && <Spinner />}
                        Save changes
                    </Button>
                </div>
            </div>
        </form>
    );
}
