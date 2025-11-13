import { useState } from 'react';
import { PackageCheck, RefreshCw, AlertTriangle } from 'lucide-react';
import ActionForm from '../components/ActionForm';
import LedgerViewer from '../components/LedgerViewer';
import NavBar from '../components/NavBar';
import BlockchainViewer from '../components/BlockchainViewer';

export default function FieldAgent() {
    const [activeForm, setActiveForm] = useState(null);

    const actions = [
        {
            id: 'receive',
            title: 'Receive at Warehouse',
            action: 'receive',
            icon: PackageCheck,
            fields: [
                { name: 'batchId', label: 'Batch ID (optional)', placeholder: 'e.g., batch-2024-001', required: false },
                { name: 'unitId', label: 'Unit ID (optional if batch ID provided)', placeholder: 'e.g., b-2024-u-001', required: false },
                { name: 'warehouseId', label: 'Warehouse ID', placeholder: 'e.g., WH-001', required: true }
            ]
        },
        {
            id: 'install',
            title: 'Receive & Verify at Site',
            action: 'install',
            icon: PackageCheck,
            fields: [
                { name: 'unitId', label: 'Unit ID', placeholder: 'e.g., b-2024-u-001', required: true },
                { name: 'siteId', label: 'Site ID', placeholder: 'e.g., SITE-001', required: true },
                { name: 'verifierId', label: 'Verifier ID', placeholder: 'e.g., agent-john', required: true }
            ]
        },
        {
            id: 'replace',
            title: 'Replace Unit',
            action: 'replace',
            icon: RefreshCw,
            fields: [
                { name: 'oldUnitId', label: 'Old Unit ID', placeholder: 'e.g., b-2024-u-001', required: true },
                { name: 'newUnitId', label: 'New Unit ID', placeholder: 'e.g., b-2024-u-002', required: true },
                { name: 'siteId', label: 'Site ID', placeholder: 'e.g., SITE-001', required: true }
            ]
        },
        {
            id: 'flag',
            title: 'Flag Lost/Damaged',
            action: 'flag',
            icon: AlertTriangle,
            fields: [
                { name: 'unitId', label: 'Unit ID', placeholder: 'e.g., b-2024-u-001', required: true },
                { 
                    name: 'reason', 
                    label: 'Reason', 
                    type: 'select',
                    required: true,
                    options: [
                        { value: 'LOST', label: 'Lost' },
                        { value: 'DAMAGED', label: 'Damaged' }
                    ]
                }
            ]
        }
    ];

    const handleFormSuccess = () => {
        setActiveForm(null);
    };

    return (
        <div className="min-h-screen bg-white">
            <NavBar 
                title="Field Agent Portal" 
                subtitle="Verify filters at sites, replace units, and flag lost/damaged filters"
            />

            <div className="px-4 py-6 pb-20">
                {/* Action Buttons - Mobile App Style */}
                <div className="space-y-3 mb-8">
                    {actions.map((action) => {
                        const IconComponent = action.icon;
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
                                            Record {action.title.toLowerCase()} on blockchain
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

                {/* Recent Transactions */}
                <div>
                    <h2 className="text-lg font-bold text-lifestraw-dark mb-4">Recent Transactions</h2>
                    <LedgerViewer limit={10} />
                </div>
            </div>

            {/* Action Forms */}
            {actions.map((action) => (
                <ActionForm
                    key={action.id}
                    isOpen={activeForm === action.id}
                    onClose={() => setActiveForm(null)}
                    action={action.action}
                    title={action.title}
                    fields={action.fields}
                    onSubmitSuccess={handleFormSuccess}
                />
            ))}

            {/* Blockchain Viewer Floating Button */}
            <BlockchainViewer hideFloatingButton={activeForm !== null} />
        </div>
    );
}

