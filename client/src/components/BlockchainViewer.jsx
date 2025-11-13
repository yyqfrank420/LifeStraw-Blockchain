import { useState, useEffect } from 'react';
import { ExternalLink, Database, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Use relative path to go through Vite proxy when accessed via ngrok
const API_BASE = import.meta.env.VITE_API_BASE || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:3000' : '');

export default function BlockchainViewer({ isFullPage = false, hideFloatingButton = false }) {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(isFullPage); // Auto-open if full page
    const [documents, setDocuments] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [couchDBStatus, setCouchDBStatus] = useState('unknown');
    const [viewMode, setViewMode] = useState('blocks'); // 'blocks' or 'state'

    const fetchBlockchainData = async () => {
        setLoading(true);
        try {
            // Always fetch transactions to show explanation if needed
            const blocksResponse = await axios.get(`${API_BASE}/api/blockchain/blocks?limit=20`);
            if (blocksResponse.data.success) {
                setTransactions(blocksResponse.data.recentTransactions || []);
            }
            
            if (viewMode === 'state') {
                // Fetch CouchDB state (query layer)
                const response = await axios.get(`${API_BASE}/api/blockchain/documents`);
                if (response.data.success) {
                    setDocuments(response.data.documents);
                    setCouchDBStatus('connected');
                } else {
                    setCouchDBStatus('unavailable');
                }
            }
        } catch (error) {
            setCouchDBStatus('error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchBlockchainData();
            // Auto-refresh every 3 seconds when open
            const interval = setInterval(fetchBlockchainData, 3000);
            return () => clearInterval(interval);
        }
    }, [isOpen, viewMode]);

    return (
        <>
            {/* Floating button (only show if not full page and no form is open) */}
            {!isFullPage && !hideFloatingButton && !isOpen && (
                <div className="fixed bottom-4 right-4 z-40">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="bg-lifestraw-blue text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 font-semibold text-sm hover:bg-[#0066A3] transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        View Blockchain
                    </button>
                </div>
            )}

            {isOpen && (
                <div className={isFullPage ? "w-full" : "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]"} onClick={() => !isFullPage && setIsOpen(false)}>
                    <div className={`bg-white ${isFullPage ? 'rounded-lg shadow-lg' : 'rounded-2xl shadow-2xl'} ${isFullPage ? 'w-full min-h-[100vh]' : 'max-w-4xl w-full max-h-[80vh]'} overflow-hidden`} onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="bg-lifestraw-blue text-white px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Database className="w-6 h-6" />
                                <div>
                                    <h3 className="font-bold text-lg">Blockchain Ledger</h3>
                                    <p className="text-xs opacity-90">Hyperledger Fabric • CouchDB</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {!isFullPage && (
                                    <button
                                        onClick={() => navigate('/blockchain')}
                                        className="px-3 py-1.5 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors flex items-center gap-1.5 text-sm font-semibold"
                                        title="Expand to full page"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                        </svg>
                                        Expand
                                    </button>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        fetchBlockchainData();
                                    }}
                                    disabled={loading}
                                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors disabled:opacity-50"
                                    title="Refresh"
                                >
                                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                                </button>
                                {!isFullPage && (
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Status Bar */}
                        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${viewMode === 'blocks' ? 'bg-green-500' : (couchDBStatus === 'connected' ? 'bg-blue-500' : 'bg-red-500')}`}></div>
                                    <span className="text-sm font-semibold text-gray-700">
                                        {viewMode === 'blocks' ? 'Blockchain Ledger (Immutable)' : 'CouchDB State (Query Layer)'}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setViewMode('blocks')}
                                        className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                                            viewMode === 'blocks' 
                                                ? 'bg-lifestraw-blue text-white' 
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        Blocks
                                    </button>
                                    <button
                                        onClick={() => setViewMode('state')}
                                        className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                                            viewMode === 'state' 
                                                ? 'bg-lifestraw-blue text-white' 
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        State
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs text-gray-600">
                                {viewMode === 'blocks' 
                                    ? `Showing ${transactions.length} transactions from blockchain ledger (source of truth)`
                                    : `Showing ${documents.length} documents from CouchDB (query layer - derived from blockchain)`}
                            </p>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto" style={{ maxHeight: isFullPage ? 'calc(100vh - 200px)' : 'calc(80vh - 180px)' }}>
                            {loading && ((viewMode === 'blocks' && transactions.length === 0) || (viewMode === 'state' && documents.length === 0)) ? (
                                <div className="text-center py-12">
                                    <RefreshCw className="w-8 h-8 text-lifestraw-blue animate-spin mx-auto mb-3" />
                                    <p className="text-gray-600">Loading blockchain data...</p>
                                </div>
                            ) : viewMode === 'blocks' ? (
                                <div className="space-y-4">
                                    {/* Architecture Explanation */}
                                    <div className="bg-blue-50 border-2 border-lifestraw-blue rounded-lg p-4">
                                        <h4 className="font-bold text-lifestraw-dark mb-2 flex items-center gap-2">
                                            <svg className="w-5 h-5 text-lifestraw-blue" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                            Blockchain Architecture
                                        </h4>
                                        <div className="text-sm text-gray-700 space-y-2">
                                            <div className="flex items-start gap-2">
                                                <span className="font-semibold">1. Blockchain Ledger:</span>
                                                <span>Immutable blocks (hash-linked chain) - <strong>SOURCE OF TRUTH</strong></span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <span className="font-semibold">2. CouchDB:</span>
                                                <span>State database (query layer) - <strong>DERIVED FROM BLOCKCHAIN</strong></span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <span className="font-semibold">Flow:</span>
                                                <span>Transaction → Blockchain Block → CouchDB State Update</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recent Blockchain Transactions */}
                                    {transactions.length > 0 ? (
                                        <div>
                                            <h4 className="font-bold text-lifestraw-dark mb-3">Recent Blockchain Transactions</h4>
                                            <div className="space-y-2">
                                                {transactions.map((tx, idx) => (
                                                    <div key={idx} className="bg-white border-2 border-lifestraw-blue rounded-lg p-3">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="font-mono text-sm font-bold text-lifestraw-blue">
                                                                TX: {tx.txId.substring(0, 24)}...
                                                            </div>
                                                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800">
                                                                ✓ On Blockchain
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-gray-600 space-y-1">
                                                            <div><span className="font-semibold">Unit:</span> {tx.unitId}</div>
                                                            <div><span className="font-semibold">Event:</span> {tx.eventType}</div>
                                                            <div><span className="font-semibold">Time:</span> {new Date(tx.timestamp * 1000).toLocaleString()}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            {/* Explanation if transactions exist but no state */}
                                            {viewMode === 'state' && documents.length === 0 && transactions.length > 0 && (
                                                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                                    <p className="text-xs text-yellow-800">
                                                        <strong>Note:</strong> You have {transactions.length} blockchain transaction{transactions.length !== 1 ? 's' : ''}, but CouchDB state may not be visible yet. 
                                                        This can happen if:
                                                    </p>
                                                    <ul className="text-xs text-yellow-700 mt-2 list-disc list-inside space-y-1">
                                                        <li>The transaction was just submitted (CouchDB syncs within 2-3 seconds)</li>
                                                        <li>The database hasn't been created yet (appears after first transaction)</li>
                                                        <li>Try refreshing or switching to "Blocks" view to see transaction IDs</li>
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                                            <Database className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                            <p className="text-gray-900 font-semibold mb-2">No transactions yet</p>
                                            <p className="text-sm text-gray-600">Submit your first transaction to see it appear on the blockchain</p>
                                        </div>
                                    )}
                                </div>
                            ) : documents.length === 0 ? (
                                <div className="text-center py-12">
                                    <Database className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-900 font-semibold mb-2">No state documents yet</p>
                                    <p className="text-sm text-gray-600">Submit your first transaction to see state appear here</p>
                                    <p className="text-xs text-gray-500 mt-2">Note: CouchDB state is derived from blockchain blocks</p>
                                    
                                    {/* Show explanation if transactions exist */}
                                    {transactions.length > 0 && (
                                        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 max-w-md mx-auto">
                                            <p className="text-xs text-yellow-800">
                                                <strong>Why no state?</strong> You have {transactions.length} blockchain transaction{transactions.length !== 1 ? 's' : ''}, but CouchDB state may not be visible yet. 
                                                CouchDB syncs within 2-3 seconds after a transaction. Try refreshing or check the "Blocks" view to see transaction IDs.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {documents.map((doc) => (
                                        <div key={doc.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-mono text-sm font-bold text-lifestraw-dark">{doc.id}</span>
                                                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                                                doc.state === 'VERIFIED' ? 'bg-green-100 text-green-800' :
                                                                doc.state === 'SHIPPED' ? 'bg-purple-100 text-purple-800' :
                                                                doc.state === 'RECEIVED' ? 'bg-yellow-100 text-yellow-800' :
                                                                doc.state === 'REGISTERED' ? 'bg-blue-100 text-blue-800' :
                                                                doc.state === 'REPLACED' ? 'bg-orange-100 text-orange-800' :
                                                                'bg-red-100 text-red-800'
                                                            }`}>
                                                            {doc.state}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                                        <span className="font-mono">Rev: {doc.rev}</span>
                                                        <span>•</span>
                                                        <span>{doc.history?.length || 0} transactions</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="w-10 h-10 bg-lifestraw-blue bg-opacity-10 rounded-lg flex items-center justify-center">
                                                        <svg className="w-5 h-5 text-lifestraw-blue" fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Metadata */}
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                {doc.batchId && (
                                                    <div className="bg-gray-50 rounded px-2 py-1">
                                                        <span className="text-gray-500">Batch:</span>{' '}
                                                        <span className="font-medium text-gray-800">{doc.batchId}</span>
                                                    </div>
                                                )}
                                                {doc.siteId && (
                                                    <div className="bg-gray-50 rounded px-2 py-1">
                                                        <span className="text-gray-500">Site:</span>{' '}
                                                        <span className="font-medium text-gray-800">{doc.siteId}</span>
                                                    </div>
                                                )}
                                                {doc.warehouseId && (
                                                    <div className="bg-gray-50 rounded px-2 py-1">
                                                        <span className="text-gray-500">Warehouse:</span>{' '}
                                                        <span className="font-medium text-gray-800">{doc.warehouseId}</span>
                                                    </div>
                                                )}
                                                    {doc.verifierId && (
                                                        <div className="bg-gray-50 rounded px-2 py-1">
                                                            <span className="text-gray-500">Verifier:</span>{' '}
                                                            <span className="font-medium text-gray-800">{doc.verifierId}</span>
                                                        </div>
                                                    )}
                                            </div>

                                            {/* History Preview */}
                                            {doc.history && doc.history.length > 0 && (
                                                <details className="mt-3">
                                                    <summary className="text-xs text-lifestraw-blue font-semibold cursor-pointer hover:underline">
                                                        View {doc.history.length} transaction{doc.history.length !== 1 ? 's' : ''}
                                                    </summary>
                                                    <div className="mt-2 space-y-1 pl-3 border-l-2 border-lifestraw-blue">
                                                        {doc.history.slice(-5).reverse().map((event, idx) => (
                                                            <div key={idx} className="text-xs text-gray-600">
                                                                <span className="font-semibold">{event.state}</span>
                                                                {event.timestamp && (
                                                                    <span className="text-gray-400 ml-2">
                                                                        {new Date(event.timestamp * 1000).toLocaleString()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </details>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-4 text-gray-600">
                                        {viewMode === 'blocks' ? (
                                            <>
                                                <span>✓ Blockchain blocks (immutable)</span>
                                                <span>✓ Hash-linked chain</span>
                                                <span>✓ Source of truth</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>✓ Current state (query layer)</span>
                                                <span>✓ Derived from blockchain</span>
                                                <span>✓ Auto-refresh every 3s</span>
                                            </>
                                        )}
                                    </div>
                                    <a
                                        href="http://localhost:5984/_utils"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-lifestraw-blue hover:underline"
                                    >
                                        <span>Open CouchDB</span>
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                                {viewMode === 'state' && (
                                    <p className="text-xs text-gray-500 italic">
                                        Note: CouchDB is a query layer. The blockchain ledger (blocks) is the immutable source of truth.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
