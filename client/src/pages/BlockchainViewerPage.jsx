import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import BlockchainViewer from '../components/BlockchainViewer';

export default function BlockchainViewerPage() {
    return (
        <div className="min-h-screen bg-lifestraw-light-gray">
            {/* Header with back button */}
            <div className="bg-white sticky top-0 z-10 shadow-sm">
                <div className="px-4 py-4">
                    <Link
                        to="/"
                        className="flex items-center gap-3 text-lifestraw-gray hover:text-lifestraw-dark transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-semibold">Back to Home</span>
                    </Link>
                </div>
            </div>

            {/* Full-page blockchain viewer */}
            <div className="p-4">
                <BlockchainViewer isFullPage={true} />
            </div>
        </div>
    );
}

