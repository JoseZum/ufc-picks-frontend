import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="container max-w-4xl py-6 px-4 space-y-6">
      {/* Back Button Skeleton */}
      <Skeleton className="h-9 w-32" />

      {/* Event Header Skeleton */}
      <Card className="card-gradient p-6 border-primary/30">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>

        <div className="space-y-2 mb-4">
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-56" />
        </div>

        <Skeleton className="h-24 w-full rounded-lg" />

        <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-2 w-32 rounded-full" />
        </div>
      </Card>

      {/* Fight Cards Skeleton */}
      {[1, 2, 3].map((section) => (
        <section key={section}>
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((bout) => (
              <Card key={bout} className="p-4">
                <Skeleton className="h-20 w-full" />
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
