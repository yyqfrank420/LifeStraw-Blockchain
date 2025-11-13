import { useState } from 'react';
import { PackageCheck, Info, AlertTriangle } from 'lucide-react';
import ActionForm from '../components/ActionForm';
import LedgerViewer from '../components/LedgerViewer';
import NavBar from '../components/NavBar';
import BlockchainViewer from '../components/BlockchainViewer';

export default function NGOManager() {
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
                { name: 'warehouseId', label: 'Warehouse ID', placeholder: 'e.g., WH-Nairobi-001', required: true }
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
                title="Local NGO Manager Portal" 
                subtitle="Receive batches at warehouse, flag lost/damaged units"
            />

            <div className="px-4 py-6 pb-20">
                {/* Info Banner */}
                <div className="bg-lifestraw-light-gray border border-lifestraw-blue border-opacity-30 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-lifestraw-blue flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-lifestraw-blue font-semibold mb-1">Warehouse Operations</p>
                            <p className="text-lifestraw-gray text-sm leading-relaxed">
                                Receive batches shipped from HQ at your warehouse. Flag any lost or damaged units during receiving. After receiving, filters are ready for field agent deployment.
                            </p>
                        </div>
                    </div>
                </div>

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
                                            {action.note || `Execute ${action.title.toLowerCase()}`}
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Transactions</h2>
                    <LedgerViewer limit={15} />
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

