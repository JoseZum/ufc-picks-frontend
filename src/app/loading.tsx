import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="space-y-4">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
    </div>
  )
}
