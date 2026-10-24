"use client";

import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { ArrowLeft, Lock } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { usePhotoUpload } from "@/hooks/usePhotoUpload";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { FieldError } from "@/components/auth/FieldError";
import { Emoji } from "@/components/Emoji";
import { PhotoPicker } from "@/components/profile/PhotoPicker";
import { GenderField, type Gender } from "@/components/profile/GenderField";
import { firstName } from "@/lib/format";

const STEPS = ["About you", "When you were born", "Where you were born"] as const;

type Errors = Partial<Record<"name" | "gender" | "birthDate" | "birthTime" | "birthPlace" | "form", string>>;

// Three short steps: everything a reading needs, nothing else.
export default function OnboardingFlow({
    counsellorName,
    initialName,
    action,
}: {
    counsellorName: string;
    initialName?: string;
    action: "chat" | "call";
}) {
    const saveProfile = useMutation(api.user.saveProfile);
    const photo = usePhotoUpload();
    const [step, setStep] = useState(0);
    // Right after sign-up the account row (and the name given there) can arrive just after this mounts,
    // so the field shows it until the person types something of their own.
    const [typedName, setName] = useState<string | null>(null);
    const name = typedName ?? initialName ?? "";
    const [gender, setGender] = useState<Gender | null>(null);
    const [birthDate, setBirthDate] = useState("");
    const [birthTime, setBirthTime] = useState("");
    const [timeUnknown, setTimeUnknown] = useState(false);
    const [birthPlace, setBirthPlace] = useState("");
    const [errors, setErrors] = useState<Errors>({});
    const [saving, setSaving] = useState(false);
    const headingRef = useRef<HTMLHeadingElement>(null);
    const [today] = useState(() => new Date().toISOString().slice(0, 10));

    function validate(): Errors {
        const e: Errors = {};
        if (step === 0) {
            if (!name.trim()) e.name = "Tell us what to call you.";
            if (!gender) e.gender = "Choose one.";
        }
        if (step === 1) {
            if (!birthDate) e.birthDate = "Enter your date of birth.";
            else if (birthDate > today) e.birthDate = "That date is in the future.";
            if (!timeUnknown && !birthTime) e.birthTime = "Enter a time, or tick “I don’t know”.";
        }
        if (step === 2 && !birthPlace.trim()) e.birthPlace = "Enter the city you were born in.";
        return e;
    }

    function goTo(next: number) {
        setStep(next);
        setErrors({});
        requestAnimationFrame(() => headingRef.current?.focus());
    }

    async function onSubmit(ev: React.FormEvent) {
        ev.preventDefault();
        const e = validate();
        setErrors(e);
        if (Object.keys(e).length > 0) {
            const firstInvalid = document.querySelector<HTMLElement>("[aria-invalid='true']");
            firstInvalid?.focus();
            return;
        }
        if (step < STEPS.length - 1) return goTo(step + 1);
        if (photo.uploading) return;
        setSaving(true);
        try {
            // Once saved, the profile query flips to onboarded and the gate shows the chat or call.
            await saveProfile({
                displayName: name.trim(),
                gender: gender!,
                birthDate,
                birthTime: timeUnknown ? undefined : birthTime,
                birthTimeUnknown: timeUnknown,
                birthPlace: birthPlace.trim(),
                profileImageStorageId: photo.storageId ?? undefined,
            });
        } catch (err) {
            setSaving(false);
            setErrors({
                form:
                    err instanceof ConvexError && typeof err.data === "string"
                        ? err.data
                        : "Your details didn't save. Check your connection and try again.",
            });
        }
    }

    const who = firstName(counsellorName);

    return (
        <div className="mx-auto w-full max-w-lg px-5 py-8 lg:py-14">
            <div className="flex items-center gap-3">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => goTo(step - 1)}
                    disabled={step === 0 || saving}
                    aria-label="Previous step"
                >
                    <ArrowLeft />
                </Button>
                <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                        Step {step + 1} of {STEPS.length}
                    </p>
                    <Progress value={((step + 1) / STEPS.length) * 100} className="mt-1.5 h-1" aria-label="Progress" />
                </div>
            </div>

            <form onSubmit={onSubmit} noValidate className="mt-8">
                <h1
                    ref={headingRef}
                    tabIndex={-1}
                    className="text-2xl leading-tight font-semibold tracking-tight outline-none sm:text-[1.75rem]"
                >
                    {STEPS[step]}
                </h1>
                {step === 0 && (
                    <p className="mt-2 text-muted-foreground">
                        Before your first {action} with {who}, a few details so the reading is about you.{" "}
                        <Emoji emoji="🙏" size={18} />
                    </p>
                )}
                {step === 1 && (
                    <p className="mt-2 text-muted-foreground">
                        The exact time sets your rising sign. If you don&rsquo;t know it, that&rsquo;s fine.
                    </p>
                )}
                {step === 2 && <p className="mt-2 text-muted-foreground">City and country are enough.</p>}

                <div key={step} className="mt-8 animate-rise space-y-6">
                    {step === 0 && (
                        <>
                            <PhotoPicker
                                name={name}
                                preview={photo.preview}
                                uploading={photo.uploading}
                                error={photo.error}
                                onPick={photo.upload}
                            />
                            <div className="space-y-2">
                                <Label htmlFor="ob-name">Name</Label>
                                <Input
                                    id="ob-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    autoComplete="name"
                                    placeholder="Asha Verma"
                                    aria-invalid={!!errors.name}
                                    aria-describedby={errors.name ? "ob-name-err" : undefined}
                                />
                                <FieldError id="ob-name-err" message={errors.name} />
                            </div>
                            <fieldset className="space-y-2">
                                <legend className="text-sm font-medium">Gender</legend>
                                <GenderField
                                    value={gender}
                                    onChange={setGender}
                                    invalid={!!errors.gender}
                                    describedBy={errors.gender ? "ob-gender-err" : undefined}
                                />
                                <FieldError id="ob-gender-err" message={errors.gender} />
                            </fieldset>
                        </>
                    )}

                    {step === 1 && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="ob-date">Date of birth</Label>
                                <Input
                                    id="ob-date"
                                    type="date"
                                    value={birthDate}
                                    min="1900-01-01"
                                    max={today}
                                    onChange={(e) => setBirthDate(e.target.value)}
                                    aria-invalid={!!errors.birthDate}
                                    aria-describedby={errors.birthDate ? "ob-date-err" : undefined}
                                />
                                <FieldError id="ob-date-err" message={errors.birthDate} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ob-time">Time of birth</Label>
                                <Input
                                    id="ob-time"
                                    type="time"
                                    value={birthTime}
                                    onChange={(e) => setBirthTime(e.target.value)}
                                    disabled={timeUnknown}
                                    aria-invalid={!!errors.birthTime}
                                    aria-describedby={errors.birthTime ? "ob-time-err" : undefined}
                                />
                                <FieldError id="ob-time-err" message={errors.birthTime} />
                                <Label
                                    htmlFor="ob-unknown"
                                    className="flex min-h-11 cursor-pointer items-center gap-3 font-normal"
                                >
                                    <Checkbox
                                        id="ob-unknown"
                                        checked={timeUnknown}
                                        onCheckedChange={(v) => setTimeUnknown(v === true)}
                                    />
                                    I don&rsquo;t know my birth time
                                </Label>
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <div className="space-y-2">
                            <Label htmlFor="ob-place">Place of birth</Label>
                            <Input
                                id="ob-place"
                                value={birthPlace}
                                onChange={(e) => setBirthPlace(e.target.value)}
                                placeholder="Jaipur, India"
                                autoComplete="off"
                                aria-invalid={!!errors.birthPlace}
                                aria-describedby={errors.birthPlace ? "ob-place-err" : undefined}
                            />
                            <FieldError id="ob-place-err" message={errors.birthPlace} />
                        </div>
                    )}
                </div>

                {errors.form && (
                    <p role="alert" className="mt-6 text-sm text-destructive">
                        {errors.form}
                    </p>
                )}

                <Button
                    type="submit"
                    size="lg"
                    className="mt-10 w-full"
                    disabled={saving || (step === 2 && photo.uploading)}
                >
                    {saving && <Spinner />}
                    {step < STEPS.length - 1 ? "Continue" : `Start ${action} with ${who}`}
                </Button>
                <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                    <Lock className="size-3" aria-hidden /> Only you and the AI see these details. Edit them any time in
                    your profile.
                </p>
            </form>
        </div>
    );
}
