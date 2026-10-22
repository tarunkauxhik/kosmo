"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";

export function PasswordInput(props: Omit<React.ComponentProps<typeof Input>, "type">) {
    const [visible, setVisible] = useState(false);
    return (
        <div className="relative">
            <Input {...props} type={visible ? "text" : "password"} className="pr-11" />
            <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? "Hide password" : "Show password"}
                aria-pressed={visible}
                className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring [&>svg]:col-start-1 [&>svg]:row-start-1 [&>svg]:size-4 [&>svg]:transition-[opacity,scale,filter] [&>svg]:duration-200 [&>svg]:ease-[cubic-bezier(0.2,0,0,1)]"
            >
                {/* Both icons stay mounted and cross-fade (opacity, scale, blur) instead of swapping. */}
                <Eye aria-hidden className={visible ? "scale-25 opacity-0 blur-[4px]" : ""} />
                <EyeOff aria-hidden className={visible ? "" : "scale-25 opacity-0 blur-[4px]"} />
            </button>
        </div>
    );
}
