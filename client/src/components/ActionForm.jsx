import { useState } from 'react';
import axios from 'axios';
import ScanButton from './ScanButton';
import { checkScanAvailability } from '../utils/scanUtils';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';
const API_KEY = import.meta.env.VITE_API_KEY || 'dev-api-key-change-in-production';

export default function ActionForm({ 
    isOpen, 
    onClose, 
    action, 
    title, 
    fields, 
    onSubmitSuccess 
}) {
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [scanStatuses, setScanStatuses] = useState({}); // Track scan status per field

    if (!isOpen) return null;

    const handleScan = async (fieldName) => {
        const availability = await checkScanAvailability();
        // ScanButton component handles the UI, we just track it here if needed
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Helper: Check if field is a Unit ID field that should have scan button
    const isUnitIdField = (fieldName) => {
        return ['unitId', 'unitIds', 'oldUnitId', 'newUnitId'].includes(fieldName);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Transform data if needed (e.g., comma-separated unitIds to array)
            let submitData = { ...formData };
            
            // Handle comma-separated unitIds for register action
            // Note: ship action no longer needs unitIds - backend infers from batchId
            if (action === 'register' && formData.unitIds) {
                submitData.unitIds = formData.unitIds
                    .split(',')
                    .map(id => id.trim())
                    .filter(id => id.length > 0);
                
                if (submitData.unitIds.length === 0) {
                    setError('At least one unit ID is required');
                    setLoading(false);
                    return;
                }
            }

            const response = await axios.post(
                `${API_BASE}/api/${action}`,
                submitData,
                {
                    headers: {
                        'X-API-Key': API_KEY,
                        'Content-Type': 'application/json'
                    }
                }
            );

            setSuccess(`Transaction successful! TX ID: ${response.data.txId}`);
            
            if (onSubmitSuccess) {
                setTimeout(() => {
                    onSubmitSuccess(response.data);
                    handleClose();
                }, 2000);
            } else {
                setTimeout(() => handleClose(), 2000);
            }
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Transaction failed');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({});
        setError(null);
        setSuccess(null);
        setScanStatuses({});
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-[60]" onClick={handleClose}>
            <div className="bg-white rounded-t-3xl shadow-2xl w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 pb-8">
                    {/* Mobile Sheet Handle */}
                    <div className="flex justify-center mb-5">
                        <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
                    </div>
                    
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-lifestraw-dark tracking-tight">{title}</h2>
                        <button
                            onClick={handleClose}
                            className="text-lifestraw-gray text-2xl leading-none w-9 h-9 flex items-center justify-center rounded-full active:bg-gray-100 transition-colors -mr-2"
                            aria-label="Close"
                        >
                            ×
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {fields.map((field) => (
                            <div key={field.name} className="mb-5">
                                <div className="flex items-center justify-between mb-2.5">
                                    <label className="block text-sm font-semibold text-lifestraw-dark">
                                        {field.label}
                                        {field.required && <span className="text-red-500 ml-1">*</span>}
                                    </label>
                                    {/* Scan Button for Unit ID fields */}
                                    {isUnitIdField(field.name) && (
                                        <ScanButton
                                            onScan={handleScan}
                                            fieldName={field.name}
                                        />
                                    )}
                                </div>

                                {field.type === 'textarea' ? (
                                    <textarea
                                        name={field.name}
                                        value={formData[field.name] || ''}
                                        onChange={handleChange}
                                        required={field.required}
                                        placeholder={field.placeholder}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-lifestraw-blue focus:border-transparent transition-all bg-white text-sm"
                                        rows={4}
                                    />
                                ) : field.type === 'select' ? (
                                    <select
                                        name={field.name}
                                        value={formData[field.name] || ''}
                                        onChange={handleChange}
                                        required={field.required}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-lifestraw-blue focus:border-transparent transition-all bg-white text-sm"
                                    >
                                        <option value="">Select {field.label}</option>
                                        {field.options?.map(opt => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type={field.type || 'text'}
                                        name={field.name}
                                        value={formData[field.name] || ''}
                                        onChange={handleChange}
                                        required={field.required}
                                        placeholder={field.placeholder}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-lifestraw-blue focus:border-transparent transition-all bg-white text-sm"
                                    />
                                )}
                            </div>
                        ))}

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
                                <p className="text-sm font-medium">{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="bg-green-50 border-2 border-green-300 text-green-800 px-4 py-3 rounded-lg mb-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 mt-0.5">
                                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold mb-2">✓ Verified on Blockchain</p>
                                        <p className="text-sm font-medium mb-2">{success}</p>
                                        <div className="mt-2 pt-2 border-t border-green-200">
                                            <p className="text-xs text-green-700 font-mono break-all">
                                                TX: {success.match(/TX ID: ([a-f0-9-]+)/i)?.[1] || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 pt-6 pb-2">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex-1 px-6 py-3.5 border-2 border-gray-300 rounded-xl text-lifestraw-dark active:bg-gray-50 font-semibold transition-colors disabled:opacity-50 text-sm"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-6 py-3.5 bg-lifestraw-blue text-white rounded-xl active:bg-[#0066A3] disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors text-sm shadow-sm"
                            >
                                {loading ? 'Submitting...' : 'Submit'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

