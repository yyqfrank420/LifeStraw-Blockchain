import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Package, Building2, Heart, Droplet } from 'lucide-react';
import Logo from '../components/Logo';
import BlockchainViewer from '../components/BlockchainViewer';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export default function Home() {
    const [livesSaved, setLivesSaved] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get(`${API_BASE}/api/stats`);
                const verifiedDeliveries = response.data?.stats?.verifiedDeliveries || 0;
                // Each LifeStraw filter provides safe water to 1 child for 1 year
                setLivesSaved(verifiedDeliveries);
            } catch (error) {
                // Silently handle stats fetch failure
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);
    const roles = [
        {
            id: 'hq-ops',
            title: 'HQ Operations',
            description: 'Register batches, ship to field, track filter history',
            icon: Building2,
            path: '/hq-ops'
        },
            {
                id: 'ngo-manager',
                title: 'Local NGO Manager',
                description: 'Receive batches at warehouse, flag lost/damaged units',
                icon: Package,
                path: '/ngo-manager'
            },
            {
                id: 'field-agent',
                title: 'Field Agent',
                description: 'Verify filters at sites, replace units, flag lost/damaged filters',
                icon: User,
                path: '/field-agent'
            },
        {
            id: 'donor',
            title: 'Donor',
            description: 'View verified delivery metrics and impact summary',
            icon: Heart,
            path: '/donor'
        }
    ];

    return (
        <div className="min-h-screen bg-lifestraw-light-gray pb-20">
            {/* Mobile App Header */}
            <div className="bg-white sticky top-0 z-10 shadow-sm">
                <div className="px-4 py-4">
                    <Logo size="default" showTagline={false} />
                </div>
            </div>

            {/* Mobile App Content */}
            <div className="px-4 py-6">
                {/* Mission Section */}
                <div className="bg-gradient-to-br from-lifestraw-blue to-[#005a8a] rounded-xl p-6 mb-6 shadow-md">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Droplet className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-white mb-2">Our Mission</h2>
                            <p className="text-white text-sm leading-relaxed opacity-95">
                                Every filter gives one child safe water for a year. 
                                Blockchain tracking ensures every filter reaches those who need it.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Lives Saved Analytics */}
                <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-lifestraw-gray uppercase tracking-wide font-semibold mb-1">
                                Lives Impacted This Year
                            </p>
                            {loading ? (
                                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
                            ) : (
                                <p className="text-3xl font-bold text-lifestraw-blue">
                                    {livesSaved.toLocaleString()}
                                </p>
                            )}
                        </div>
                        <div className="w-16 h-16 bg-lifestraw-blue bg-opacity-10 rounded-full flex items-center justify-center">
                            <Heart className="w-8 h-8 text-lifestraw-blue" />
                        </div>
                    </div>
                    <p className="text-xs text-lifestraw-gray mt-3 leading-relaxed">
                        Each verified delivery represents one child receiving safe water for a full year
                    </p>
                </div>

                {/* Welcome Section */}
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-lifestraw-dark mb-2">Get Started</h2>
                    <p className="text-lifestraw-gray text-sm leading-relaxed">Select your role to continue</p>
                </div>

                {/* Full-Width Mobile Cards */}
                <div className="space-y-3">
                    {roles.map((role) => {
                        const IconComponent = role.icon;
                        return (
                            <Link
                                key={role.id}
                                to={role.path}
                                className="block"
                            >
                                <div className="bg-white rounded-xl p-5 shadow-sm active:shadow-md active:bg-gray-50 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-lifestraw-blue rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                                            <IconComponent className="w-7 h-7 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-bold text-lifestraw-dark mb-1.5">{role.title}</h3>
                                            <p className="text-sm text-lifestraw-gray leading-relaxed line-clamp-2">{role.description}</p>
                                        </div>
                                        <div className="text-lifestraw-blue flex-shrink-0 opacity-60">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                    <div className="flex flex-col items-center gap-3 text-center">
                        <p className="text-xs text-lifestraw-gray mb-2">Powered by</p>
                        <div className="flex items-center gap-2">
                            <svg 
                                className="w-6 h-6" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path 
                                    d="M12 2L2 7L12 12L22 7L12 2Z" 
                                    fill="#1a1a1a" 
                                    fillOpacity="0.8"
                                />
                                <path 
                                    d="M2 17L12 22L22 17V12L12 17L2 12V17Z" 
                                    fill="#1a1a1a" 
                                    fillOpacity="0.8"
                                />
                            </svg>
                            <span className="text-sm font-semibold text-lifestraw-dark">
                                Hyperledger Fabric
                            </span>
                        </div>
                        <p className="text-xs text-lifestraw-gray mt-2">
                            Immutable blockchain verification for transparent impact tracking
                        </p>
                    </div>
                </div>
            </div>

            {/* Blockchain Viewer Floating Button */}
            <BlockchainViewer />
        </div>
    );
}

