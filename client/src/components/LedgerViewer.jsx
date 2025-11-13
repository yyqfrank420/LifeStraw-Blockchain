import { useState, useEffect } from 'react';
import axios from 'axios';
import SkeletonLoader from './SkeletonLoader';
import { FileText } from 'lucide-react';

// Use relative path to go through Vite proxy when accessed via ngrok
// Vite proxy is configured to forward /api to http://localhost:3000
const API_BASE = import.meta.env.VITE_API_BASE || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:3000' : '');

export default function LedgerViewer({ limit = 25 }) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchEvents();
        // Refresh every 5 seconds
        const interval = setInterval(fetchEvents, 5000);
        return () => clearInterval(interval);
    }, [limit]);

    const fetchEvents = async () => {
        try {
            const response = await axios.get(`${API_BASE}/api/recent?limit=${limit}`);
            setEvents(response.data.events || []);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load events');
        } finally {
            setLoading(false);
        }
    };

    const formatTimestamp = (ts) => {
        return new Date(ts * 1000).toLocaleString();
    };

    const getEventColor = (eventType) => {
        const colors = {
            REGISTERED: 'bg-blue-100 text-blue-800',
            SHIPPED: 'bg-purple-100 text-purple-800',
            RECEIVED: 'bg-yellow-100 text-yellow-800',
            VERIFIED: 'bg-green-100 text-green-800',
            REPLACED: 'bg-orange-100 text-orange-800',
            FLAGGED: 'bg-red-100 text-red-800'
        };
        return colors[eventType] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return <SkeletonLoader type="table" rows={Math.min(limit, 5)} />;
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-base font-bold text-lifestraw-dark">Recent Transactions</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-lifestraw-light-gray">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-lifestraw-gray uppercase">Unit</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-lifestraw-gray uppercase">Event</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-lifestraw-gray uppercase">TX ID</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-lifestraw-gray uppercase">Time</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {events.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-4 py-12 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                            <FileText className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <p className="text-gray-900 font-semibold mb-1">No transactions yet</p>
                                        <p className="text-sm text-gray-500 max-w-md">
                                            Transactions will appear here once you submit your first filter operation
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            events.map((event) => (
                                <tr key={event.txId} className="active:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 text-sm font-medium text-lifestraw-dark">{event.unitId}</td>
                                    <td className="px-4 py-3 text-sm">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${getEventColor(event.eventType)}`}>
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            {event.eventType}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs">
                                        <div className="flex items-center gap-1.5">
                                            <svg className="w-3 h-3 text-lifestraw-blue" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                            </svg>
                                            <span className="font-mono text-lifestraw-blue text-[10px] break-all max-w-[80px] truncate" title={event.txId}>
                                                {event.txId?.substring(0, 8)}...
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-lifestraw-gray">
                                        {event.ts ? formatTimestamp(event.ts) : '—'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

