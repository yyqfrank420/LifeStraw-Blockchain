/**
 * Camera/NFC Scanning Utility
 * Reusable function to check for camera/NFC availability and handle scanning
 */

/**
 * Check for camera/NFC availability
 * @returns {Promise<{hasCamera: boolean, hasNFC: boolean, available: boolean}>}
 */
export async function checkScanAvailability() {
    try {
        // Check for camera
        const hasCamera = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
        
        // Check for NFC (if available)
        const hasNFC = 'NDEFReader' in window;
        
        // Simulate check delay for UX
        await new Promise(resolve => setTimeout(resolve, 800));
        
        return {
            hasCamera: !!hasCamera,
            hasNFC: !!hasNFC,
            available: hasCamera || hasNFC
        };
    } catch (err) {
        return {
            hasCamera: false,
            hasNFC: false,
            available: false
        };
    }
}

/**
 * Attempt to scan (for MVP, just checks availability)
 * In production, this would open camera/NFC scanner
 * @param {Function} onResult - Callback with scanned value
 * @returns {Promise<string|null>} - Scanned value or null if unavailable
 */
export async function attemptScan(onResult = null) {
    const availability = await checkScanAvailability();
    
    if (!availability.available) {
        return null;
    }
    
    // In production, this would:
    // - Open camera for QR code scanning
    // - Or activate NFC reader for tag scanning
    // - Return the scanned value
    
    // For MVP, return null (unavailable)
    return null;
}

