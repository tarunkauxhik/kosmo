import { ChatInboxSkeleton } from "@/components/chat/ChatInbox";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div className="lg:flex lg:h-dvh">
            <div className="lg:w-80 lg:shrink-0 lg:border-r">
                <div className="space-y-4 px-5 pt-6 pb-3 lg:px-4">
                    <Skeleton className="h-8 w-28 rounded-md" />
                    <Skeleton className="h-11 rounded-lg" />
                </div>
                <ChatInboxSkeleton />
            </div>
        </div>
    );
}
