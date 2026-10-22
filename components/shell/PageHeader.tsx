import { cn } from "@/lib/utils";

export function PageHeader({
    title,
    description,
    action,
    className,
}: {
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
            <div className="min-w-0">
                <h1 className="text-2xl leading-tight font-semibold tracking-tight sm:text-[1.75rem]">{title}</h1>
                {description && (
                    <p className="mt-1.5 max-w-2xl text-[0.9375rem] text-muted-foreground">{description}</p>
                )}
            </div>
            {action}
        </div>
    );
}
