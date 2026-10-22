import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div
            className="mx-auto w-full max-w-5xl px-5 py-6 lg:px-8 lg:py-10"
            role="status"
            aria-label="Loading astrologer"
        >
            <Skeleton className="h-8 w-36 rounded-md" />
            <div className="mt-4 grid gap-10 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-14">
                <div className="space-y-4">
                    <Skeleton className="size-[120px] rounded-full lg:size-44" />
                    <Skeleton className="h-7 w-48 rounded-md" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-7 w-3/4 rounded-md" />
                    <Skeleton className="h-4 w-full rounded-md" />
                    <Skeleton className="h-4 w-5/6 rounded-md" />
                </div>
            </div>
        </div>
    );
}
