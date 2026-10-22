import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div
            className="mx-auto w-full max-w-3xl px-5 py-6 lg:px-8 lg:py-10"
            role="status"
            aria-label="Loading transcript"
        >
            <Skeleton className="mb-6 h-8 w-24 rounded-md" />
            <div className="flex items-center gap-4 border-b pb-6">
                <Skeleton className="size-16 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-6 w-44 rounded-md" />
                    <Skeleton className="h-4 w-56 rounded-md" />
                </div>
            </div>
            <div className="space-y-4 pt-6">
                {[55, 70, 40, 65].map((w, i) => (
                    <div key={i} className={i % 2 ? "flex justify-end" : "flex"}>
                        <Skeleton className="h-14 rounded-2xl" style={{ width: `${w}%` }} />
                    </div>
                ))}
            </div>
        </div>
    );
}
