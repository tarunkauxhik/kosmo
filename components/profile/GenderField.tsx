"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

export type Gender = "male" | "female";

export function GenderField({
    value,
    onChange,
    invalid,
    describedBy,
}: {
    value: Gender | null;
    onChange: (g: Gender) => void;
    invalid?: boolean;
    describedBy?: string;
}) {
    return (
        <RadioGroup
            value={value ?? ""}
            onValueChange={(v) => onChange(v as Gender)}
            className="grid grid-cols-2 gap-2"
            aria-label="Gender"
            aria-invalid={invalid}
            aria-describedby={describedBy}
        >
            {(["female", "male"] as const).map((g) => (
                <Label
                    key={g}
                    htmlFor={`gender-${g}`}
                    className={cn(
                        "flex h-11 cursor-pointer items-center gap-3 rounded-lg bg-card px-3.5 font-medium capitalize shadow-surface transition-[box-shadow,background-color] duration-150 hover:shadow-surface-hover",
                        value === g &&
                            "bg-brand/8 shadow-[0_0_0_1.5px_var(--brand)] hover:shadow-[0_0_0_1.5px_var(--brand)]",
                    )}
                >
                    <RadioGroupItem id={`gender-${g}`} value={g} />
                    {g}
                </Label>
            ))}
        </RadioGroup>
    );
}
