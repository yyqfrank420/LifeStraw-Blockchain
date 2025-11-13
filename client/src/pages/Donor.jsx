import { useState, useEffect } from 'react';
import { Heart, CheckCircle, Droplet, RefreshCw } from 'lucide-react';
import axios from 'axios';
import StatCard from '../components/StatCard';
import LedgerViewer from '../components/LedgerViewer';
import SkeletonLoader from '../components/SkeletonLoader';
import NavBar from '../components/NavBar';

// Use relative path to go through Vite proxy when accessed via ngrok
const API_BASE = import.meta.env.VITE_API_BASE || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:3000' : '');

export default function Donor() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStats();
        // Refresh every 10 seconds
        const interval = setInterval(fetchStats, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchStats = async () => {
        try {
            const response = await axios.get(`${API_BASE}/api/stats`);
            setStats(response.data.stats);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load statistics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <NavBar />
                <div className="px-4 py-6 pb-20">
                    <div className="h-32 w-full bg-gray-200 rounded-lg animate-pulse mb-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <SkeletonLoader key={i} type="card" />
                        ))}
                    </div>
                    <SkeletonLoader type="table" rows={5} />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <NavBar 
                title="Donor Dashboard" 
                subtitle="Verified delivery metrics and impact summary"
            />

            <div className="px-4 py-6 pb-20">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                        {error}
                    </div>
                )}

                {/* Impact Message */}
                <div className="bg-gradient-to-br from-lifestraw-blue to-[#005a8a] rounded-xl p-6 mb-6 shadow-md">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Heart className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-white mb-2">Your Impact</h2>
                            <p className="text-white text-sm leading-relaxed opacity-95">
                                Every filter gives one child safe water for a year. 
                                Blockchain tracking ensures every verified delivery reaches those who need it.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <StatCard
                        title="Total Filters"
                        value={stats?.totalUnits || 0}
                        subtitle="Registered in system"
                        icon={<CheckCircle className="w-6 h-6" />}
                        color="blue"
                    />
                    <StatCard
                        title="Verified Deliveries"
                        value={stats?.verifiedDeliveries || 0}
                        subtitle="Verified at site + Replaced"
                        icon={<CheckCircle className="w-6 h-6" />}
                        color="blue"
                    />
                        <StatCard
                            title="Verified at Site"
                            value={stats?.verifiedCount || 0}
                            subtitle="Currently providing safe water"
                            icon={<Droplet className="w-6 h-6" />}
                            color="blue"
                        />
                    <StatCard
                        title="Replacement Compliance"
                        value={`${stats?.replacementCompliance || 0}%`}
                        subtitle="Replacement rate"
                        icon={<RefreshCw className="w-6 h-6" />}
                        color="blue"
                    />
                </div>

                {/* State Breakdown */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                    <h3 className="text-lg font-bold text-lifestraw-dark mb-4">Filter Status Breakdown</h3>
                    {stats && Object.keys(stats.stateCounts || {}).length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.entries(stats.stateCounts || {}).map(([state, count]) => (
                                <div key={state} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <p className="text-xs font-medium text-gray-600 mb-1">{state}</p>
                                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Droplet className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-lifestraw-dark font-semibold mb-1">No filters registered yet</p>
                            <p className="text-sm text-lifestraw-gray">Register your first batch to see status breakdown</p>
                        </div>
                    )}
                </div>

                {/* Recent Transactions */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-lifestraw-dark mb-4">Recent Transactions</h2>
                    <LedgerViewer limit={5} />
                </div>

                {/* Transparency Note */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">Blockchain Transparency</h3>
                    <p className="text-blue-800 text-sm leading-relaxed">
                        All data shown here is verified and recorded on the Hyperledger Fabric blockchain. 
                        Each transaction is cryptographically secured and cannot be altered. 
                        View transaction history in the "Recent Transactions" section above.
                    </p>
                </div>
            </div>
        </div>
    );
}

