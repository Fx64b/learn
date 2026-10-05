/** Placeholder shown until a session is mounted in the browser. */
export function SessionSkeleton() {
    return (
        <div className="flex animate-pulse flex-col gap-6" aria-busy>
            <div className="flex items-center gap-3">
                <div className="bg-muted size-9 rounded-md" />
                <div className="bg-muted h-4 flex-1 rounded-full" />
            </div>
            <div className="bg-muted h-80 rounded-2xl" />
        </div>
    )
}
