export default function StatCard({ title, value, subtitle, icon, color = 'blue' }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
                    <p className="text-4xl font-bold text-gray-900 mb-1">{value}</p>
                    {subtitle && (
                        <p className="text-sm text-gray-500">{subtitle}</p>
                    )}
                </div>
                {icon && (
                    <div className="flex-shrink-0 w-12 h-12 bg-[#007CC3] bg-opacity-10 rounded-lg flex items-center justify-center">
                        <div className="text-[#007CC3]">
                            {icon}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

