export default function SkeletonLoader({ type = 'table', rows = 5 }) {
    if (type === 'table') {
        return (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="divide-y divide-gray-200">
                    {Array.from({ length: rows }).map((_, i) => (
                        <div key={i} className="px-6 py-4">
                            <div className="flex items-center gap-4">
                                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                                <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                                <div className="h-4 w-40 bg-gray-200 rounded animate-pulse ml-auto"></div>
                                <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (type === 'card') {
        return (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-3"></div>
                        <div className="h-10 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
                        <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
            </div>
        );
    }

    if (type === 'list') {
        return (
            <div className="space-y-3">
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return null;
}

