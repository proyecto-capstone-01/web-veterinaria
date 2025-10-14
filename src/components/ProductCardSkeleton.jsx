import { Skeleton } from "@/components/ui/skeleton";

export default function ProductCardSkeleton() {
    return (
        <div className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden block">
        {/* Imagen */}
        <Skeleton className="w-full h-48 bg-gray-100" />

        {/* Contenido */}
        <div className="p-4 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-6 w-20" />
        </div>
        </div>
    );
}