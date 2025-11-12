import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Logo from './Logo';

export default function NavBar({ title, subtitle, showBack = true }) {
    return (
        <div className="bg-white sticky top-0 z-10 shadow-sm">
            <div className="px-4 py-4">
                <div className="flex items-center gap-3">
                    {showBack && (
                        <Link
                            to="/"
                            className="flex items-center justify-center w-10 h-10 -ml-2 text-lifestraw-gray active:bg-gray-100 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                    )}
                    {!title ? (
                        <Logo size="small" showTagline={false} />
                    ) : (
                        <div className="flex-1 min-w-0">
                            {title && (
                                <h1 className="text-lg font-bold text-lifestraw-dark truncate">{title}</h1>
                            )}
                            {subtitle && (
                                <p className="text-xs text-lifestraw-gray truncate">{subtitle}</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

