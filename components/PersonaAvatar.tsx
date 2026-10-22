import Image from "next/image";
import { cn } from "@/lib/utils";

// Round persona portrait with a hairline outline that holds its edge on any surface.
// `size` is the rendered size in px. For a size that changes with the breakpoint, pass `sizes`
// and set the dimensions with className instead. `eager` is for the one above-the-fold portrait.
export function PersonaAvatar({
    src,
    name,
    size = 56,
    sizes,
    eager = false,
    className,
}: {
    src: string;
    name: string;
    size?: number;
    sizes?: string;
    eager?: boolean;
    className?: string;
}) {
    return (
        <span
            className={cn("relative inline-block shrink-0 rounded-full bg-muted", className)}
            style={sizes ? undefined : { width: size, height: size }}
        >
            <Image
                src={src}
                alt={`AI-generated portrait of ${name}`}
                fill
                sizes={sizes ?? `${size}px`}
                loading={eager ? "eager" : "lazy"}
                fetchPriority={eager ? "high" : "auto"}
                className="image-outline rounded-full object-cover"
            />
        </span>
    );
}
