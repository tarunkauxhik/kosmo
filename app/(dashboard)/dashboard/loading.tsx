import { AstrologerGridSkeleton } from "@/components/astrologers/AstrologerCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="mx-auto w-full max-w-6xl px-5 py-6 lg:px-8 lg:py-10">
            <Skeleton className="h-9 w-48 rounded-md" />
            <Skeleton className="mt-3 h-4 w-80 max-w-full rounded-md" />
            <div className="mt-10">
                <AstrologerGridSkeleton />
            </div>
        </div>
    );
}
