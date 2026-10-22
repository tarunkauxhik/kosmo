import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function UserAvatar({
    name,
    imageUrl,
    className,
}: {
    name: string;
    imageUrl?: string | null;
    className?: string;
}) {
    return (
        <Avatar className={cn("size-9", className)}>
            {imageUrl && <AvatarImage src={imageUrl} alt="" />}
            <AvatarFallback className="bg-muted text-sm font-medium text-foreground">
                {(name.trim()[0] ?? "?").toUpperCase()}
            </AvatarFallback>
        </Avatar>
    );
}
