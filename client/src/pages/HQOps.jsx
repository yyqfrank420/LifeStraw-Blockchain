import { useState, useEffect } from 'react';
import { Search, Download, Clock, FileSearch, FilePlus, Truck, Info } from 'lucide-react';
import axios from 'axios';
import NavBar from '../components/NavBar';
import BlockchainViewer from '../components/BlockchainViewer';
import ActionForm from '../components/ActionForm';
import LedgerViewer from '../components/LedgerViewer';
import ScanButton from '../components/ScanButton';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export default function HQOps() {
    const [unitSearchQuery, setUnitSearchQuery] = useState('');
    const [batchSearchQuery, setBatchSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [unitHistory, setUnitHistory] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [activeForm, setActiveForm] = useState(null);
    const [showSearch, setShowSearch] = useState(false);

    const actions = [
        {
            id: 'register',
            title: 'Register New Batch',
            action: 'register',
            icon: FilePlus,
            fields: [
                { name: 'batchId', label: 'Batch ID', placeholder: 'e.g., batch-2024-001', required: true },
                { 
                    name: 'unitIds', 
                    label: 'Unit IDs (comma-separated)', 
                    type: 'textarea',
                    placeholder: 'b-2024-u-001, b-2024-u-002, b-2024-u-003',
                    required: true 
                }
            ]
        },
        {
            id: 'ship',
            title: 'Ship Batch',
            action: 'ship',
            icon: Truck,
            fields: [
                { name: 'batchId', label: 'Batch ID', placeholder: 'e.g., batch-2024-001', required: true },
                { name: 'destination', label: 'Destination', placeholder: 'e.g., Nairobi Warehouse', required: true }
            ]
        },
        {
            id: 'track',
            title: 'Track Unit',
            action: 'track',
            icon: FileSearch,
            isSearch: true
        }
    ];

    const handleFormSuccess = () => {
        setActiveForm(null);
    };

    const handleTrackClick = () => {
        setShowSearch(!showSearch);
        setActiveForm(null);
    };

    const handleUnitSearch = async (e) => {
        e.preventDefault();
        if (!unitSearchQuery.trim()) return;

        setLoading(true);
        setError(null);
        setUnitHistory(null);
        setSearchResults([]);

        try {
            const response = await axios.get(`${API_BASE}/api/read/${unitSearchQuery.trim()}`);
            setUnitHistory(response.data.unit);
            setSelectedUnit(unitSearchQuery.trim());
        } catch (err) {
            setError(err.response?.data?.error || 'Unit not found');
        } finally {
            setLoading(false);
        }
    };

    const handleBatchSearch = async (e) => {
        e.preventDefault();
        if (!batchSearchQuery.trim()) return;

        setLoading(true);
        setError(null);
        setUnitHistory(null);
        setSearchResults([]);

        try {
            const searchResponse = await axios.get(`${API_BASE}/api/search?q=${encodeURIComponent(batchSearchQuery.trim())}`);
            setSearchResults(searchResponse.data.results || []);
            if (searchResponse.data.results && searchResponse.data.results.length === 0) {
                setError('No units found for this batch');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Search failed');
        } finally {
            setLoading(false);
        }
    };

    const handleUnitClick = async (unitId) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_BASE}/api/read/${unitId}`);
            setUnitHistory(response.data.unit);
            setSelectedUnit(unitId);
            setSearchResults([]);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load unit history');
        } finally {
            setLoading(false);
        }
    };

    const exportHistory = () => {
        if (!unitHistory) return;

        const dataStr = JSON.stringify(unitHistory, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `unit-${selectedUnit}-history.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const formatTimestamp = (ts) => {
        return new Date(ts * 1000).toLocaleString();
    };

    return (
        <div className="min-h-screen bg-white">
            <NavBar 
                title="HQ Operations Portal" 
                subtitle="Register batches, ship to field, track filter history"
            />

            <div className="px-4 py-6 pb-20">
                {/* Info Banner */}
                <div className="bg-lifestraw-light-gray border border-lifestraw-blue border-opacity-30 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-lifestraw-blue flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-lifestraw-blue font-semibold mb-1">HQ Operations</p>
                            <p className="text-lifestraw-gray text-sm leading-relaxed">
                                Workflow: 1) Register Batch → 2) Ship Batch → 3) Track Unit
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons - Mobile App Style */}
                <div className="space-y-3 mb-8">
                    {actions.map((action) => {
                        const IconComponent = action.icon;
                        if (action.isSearch) {
                            return (
                                <button
                                    key={action.id}
                                    onClick={handleTrackClick}
                                    className="w-full bg-white rounded-xl p-5 shadow-sm active:shadow-md active:bg-gray-50 text-left transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-lifestraw-blue rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                                            <IconComponent className="w-7 h-7 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base font-bold text-lifestraw-dark mb-1.5">
                                                {action.title}
                                            </h3>
                                            <p className="text-xs text-lifestraw-gray leading-relaxed">
                                                Search and view complete filter history
                                            </p>
                                        </div>
                                        <div className="text-lifestraw-blue flex-shrink-0 opacity-60">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showSearch ? "M5 15l7-7 7 7" : "M9 5l7 7-7 7"} />
                                            </svg>
                                        </div>
                                    </div>
                                </button>
                            );
                        }
                        return (
                            <button
                                key={action.id}
                                onClick={() => setActiveForm(action.id)}
                                className="w-full bg-white rounded-xl p-5 shadow-sm active:shadow-md active:bg-gray-50 text-left transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-lifestraw-blue rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                                        <IconComponent className="w-7 h-7 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-bold text-lifestraw-dark mb-1.5">
                                            {action.title}
                                        </h3>
                                        <p className="text-xs text-lifestraw-gray leading-relaxed">
                                            Execute {action.title.toLowerCase()}
                                        </p>
                                    </div>
                                    <div className="text-lifestraw-blue flex-shrink-0 opacity-60">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Track Unit - Only show when Track Unit is clicked */}
                {showSearch && (
                    <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border-2 border-lifestraw-blue">
                        <h3 className="text-lg font-bold text-lifestraw-dark mb-4">Track Filter</h3>
                        
                        {/* Unit ID Search */}
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-semibold text-lifestraw-dark">
                                    Search by Unit ID
                                </label>
                                <ScanButton
                                    onScan={() => {}}
                                    fieldName="unitId"
                                />
                            </div>
                            <form onSubmit={handleUnitSearch} className="flex gap-3">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={unitSearchQuery}
                                        onChange={(e) => setUnitSearchQuery(e.target.value)}
                                        placeholder="e.g., b-2024-u-001"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-lifestraw-blue focus:border-transparent text-sm"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || !unitSearchQuery.trim()}
                                    className="px-5 py-3 bg-lifestraw-blue text-white rounded-xl hover:bg-[#0066A3] disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors text-sm"
                                >
                                    {loading ? '...' : 'Search'}
                                </button>
                            </form>
                        </div>

                        {/* Batch ID Search */}
                        <div>
                            <label className="block text-sm font-semibold text-lifestraw-dark mb-2">
                                Search by Batch ID
                            </label>
                            <form onSubmit={handleBatchSearch} className="flex gap-3">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={batchSearchQuery}
                                        onChange={(e) => setBatchSearchQuery(e.target.value)}
                                        placeholder="e.g., batch-2024-001"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-lifestraw-blue focus:border-transparent text-sm"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || !batchSearchQuery.trim()}
                                    className="px-5 py-3 bg-lifestraw-blue text-white rounded-xl hover:bg-[#0066A3] disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors text-sm"
                                >
                                    {loading ? '...' : 'Search'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                        {error}
                    </div>
                )}

                {/* Search Results */}
                {searchResults.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Results</h2>
                        <div className="space-y-2">
                            {searchResults.map((unit) => (
                                <button
                                    key={unit.unitId}
                                    onClick={() => handleUnitClick(unit.unitId)}
                                    className="w-full text-left px-4 py-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <span className="font-semibold text-gray-900">{unit.unitId}</span>
                                            <span className="text-gray-600 ml-2">({unit.state})</span>
                                        </div>
                                        <span className="text-[#007CC3] font-semibold">→</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Unit History */}
                {unitHistory && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">
                                    Unit: {selectedUnit}
                                </h2>
                                <p className="text-gray-600 mt-1">
                                    Current State: <span className="font-semibold">{unitHistory.state}</span>
                                </p>
                            </div>
                            <button
                                onClick={exportHistory}
                                className="flex items-center gap-2 px-4 py-2 bg-[#007CC3] text-white rounded-lg hover:bg-[#0066A3] transition-colors font-semibold"
                            >
                                <Download className="w-4 h-4" />
                                Export JSON
                            </button>
                        </div>

                        {/* Unit Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                                <p className="text-sm font-medium text-gray-600 mb-1">Batch ID</p>
                                <p className="font-semibold text-gray-900">{unitHistory.batchId || 'N/A'}</p>
                            </div>
                            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                                <p className="text-sm font-medium text-gray-600 mb-1">Site ID</p>
                                <p className="font-semibold text-gray-900">{unitHistory.siteId || 'N/A'}</p>
                            </div>
                            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                                <p className="text-sm font-medium text-gray-600 mb-1">Warehouse ID</p>
                                <p className="font-semibold text-gray-900">{unitHistory.warehouseId || 'N/A'}</p>
                            </div>
                            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                                <p className="text-sm font-medium text-gray-600 mb-1">Verifier ID</p>
                                <p className="font-semibold text-gray-900">{unitHistory.verifierId || 'N/A'}</p>
                            </div>
                        </div>

                        {/* History Timeline */}
                        <div>
                            <h3 className="text-xl font-semibold mb-4">Event History</h3>
                            <div className="space-y-3">
                                {unitHistory.history && unitHistory.history.length > 0 ? (
                                    unitHistory.history.map((event, index) => (
                                        <div
                                            key={index}
                                            className="border-l-4 border-[#007CC3] pl-6 py-4 bg-gray-50 rounded-r-lg"
                                        >
                                            <div className="flex items-start gap-3">
                                                <Clock className="w-5 h-5 text-[#007CC3] flex-shrink-0 mt-0.5" />
                                                <div className="flex-1">
                                                    <p className="font-semibold text-gray-900 mb-1">{event.eventType}</p>
                                                    <p className="text-sm text-gray-600 mb-1">
                                                        {formatTimestamp(event.timestamp)}
                                                    </p>
                                                    {event.org && (
                                                        <p className="text-xs text-gray-500">Org: {event.org}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Clock className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <p className="text-gray-900 font-semibold mb-1">No history available</p>
                                        <p className="text-sm text-gray-500">This unit has no recorded events yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty State - Only show when Track Unit is expanded */}
                {!unitHistory && searchResults.length === 0 && !loading && showSearch && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                                <FileSearch className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Track Filter</h3>
                            <p className="text-gray-600 max-w-md mb-4">
                                Enter a Unit ID or Batch ID above to view complete history and export data
                            </p>
                            <div className="text-sm text-gray-500">
                                <p>Examples: b-2024-u-001, batch-2024-001</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Recent Transactions */}
                <div className="mt-8">
                    <h2 className="text-lg font-bold text-lifestraw-dark mb-4">Recent Transactions</h2>
                    <LedgerViewer limit={10} />
                </div>
            </div>

            {/* Action Forms */}
            {actions.map((action) => {
                if (action.isSearch) return null;
                return (
                    <ActionForm
                        key={action.id}
                        isOpen={activeForm === action.id}
                        onClose={() => setActiveForm(null)}
                        action={action.action}
                        title={action.title}
                        fields={action.fields}
                        onSubmitSuccess={handleFormSuccess}
                    />
                );
            })}

            {/* Blockchain Viewer Floating Button */}
            <BlockchainViewer hideFloatingButton={activeForm !== null} />
        </div>
    );
}

