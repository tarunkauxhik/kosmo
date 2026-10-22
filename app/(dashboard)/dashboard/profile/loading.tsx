import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="mx-auto w-full max-w-4xl px-5 py-6 lg:px-8 lg:py-10" role="status" aria-label="Loading profile">
            <Skeleton className="h-9 w-32 rounded-md" />
            <Skeleton className="mt-3 h-4 w-72 max-w-full rounded-md" />
            {[0, 1].map((i) => (
                <div key={i} className="mt-8 grid gap-6 border-t pt-8 md:grid-cols-[14rem_1fr]">
                    <Skeleton className="h-4 w-28 rounded-md" />
                    <div className="max-w-md space-y-4">
                        <Skeleton className="h-11 rounded-lg" />
                        <Skeleton className="h-11 rounded-lg" />
                    </div>
                </div>
            ))}
        </div>
    );
}
