import { useState } from 'react';
import { Camera } from 'lucide-react';
import { checkScanAvailability } from '../utils/scanUtils';

/**
 * Reusable Scan Button Component
 * Can be used on any page with input fields
 */
export default function ScanButton({ 
    onScan, 
    fieldName, 
    disabled = false,
    className = "" 
}) {
    const [scanStatus, setScanStatus] = useState(null); // 'checking' | 'unavailable' | null

    const handleScan = async () => {
        setScanStatus('checking');
        
        try {
            const availability = await checkScanAvailability();
            
            if (!availability.available) {
                setScanStatus('unavailable');
                // Clear status after 5 seconds
                setTimeout(() => setScanStatus(null), 5000);
            } else {
                // In production, this would open camera/NFC scanner
                // For MVP, just show unavailable message
                setScanStatus('unavailable');
                setTimeout(() => setScanStatus(null), 5000);
            }
            
            // Call parent callback if provided
            if (onScan) {
                onScan(availability);
            }
        } catch (err) {
            setScanStatus('unavailable');
            setTimeout(() => setScanStatus(null), 5000);
        }
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={handleScan}
                disabled={disabled || scanStatus === 'checking'}
                className={`flex items-center gap-1.5 px-3 py-1.5 bg-lifestraw-blue text-white rounded-lg text-xs font-semibold active:bg-[#0066A3] disabled:opacity-50 transition-colors ${className}`}
            >
                {scanStatus === 'checking' ? (
                    <>
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Checking...
                    </>
                ) : (
                    <>
                        <Camera className="w-3.5 h-3.5" />
                        Scan
                    </>
                )}
            </button>
            
            {/* Show scan unavailable message - positioned absolutely or inline based on context */}
            {scanStatus === 'unavailable' && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3 z-10 shadow-md">
                    <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1">
                            <p className="text-xs font-semibold text-yellow-800 mb-1">
                                No camera or NFC detected
                            </p>
                            <p className="text-xs text-yellow-700">
                                Please enter the value manually
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

