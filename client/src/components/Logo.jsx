export default function Logo({ size = 'default', showTagline = true }) {
    const sizes = {
        small: 'text-base',
        default: 'text-xl',
        large: 'text-2xl'
    };

    const gridSizes = {
        small: { container: 'w-4 h-4', cell: 'w-1 h-1' },
        default: { container: 'w-5 h-5', cell: 'w-1.5 h-1.5' },
        large: { container: 'w-6 h-6', cell: 'w-2 h-2' }
    };

    const gridSize = gridSizes[size];

    return (
        <div className="flex items-center gap-2.5">
            {/* LifeStraw Text with Registered Mark */}
            <div className="flex items-baseline gap-0.5">
                <span className={`${sizes[size]} font-bold text-lifestraw-dark tracking-tight`}>
                    LifeStraw
                </span>
                <span className="text-[0.55em] text-lifestraw-dark leading-none">®</span>
            </div>
            
            {/* Grid Icon - 3x3 mesh pattern matching LifeStraw logo */}
            <svg 
                className={`${gridSize.container} flex-shrink-0`} 
                viewBox="0 0 12 12" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Grid lines - vertical */}
                <line x1="4" y1="0" x2="4" y2="12" stroke="#1a1a1a" strokeWidth="0.5"/>
                <line x1="8" y1="0" x2="8" y2="12" stroke="#1a1a1a" strokeWidth="0.5"/>
                {/* Grid lines - horizontal */}
                <line x1="0" y1="4" x2="12" y2="4" stroke="#1a1a1a" strokeWidth="0.5"/>
                <line x1="0" y1="8" x2="12" y2="8" stroke="#1a1a1a" strokeWidth="0.5"/>
                {/* Outer border */}
                <rect x="0" y="0" width="12" height="12" fill="none" stroke="#1a1a1a" strokeWidth="0.5"/>
            </svg>
            
            {/* VESTERGAARD Tagline */}
            {showTagline && (
                <span className="text-[0.6em] text-lifestraw-gray font-medium tracking-wider uppercase">
                    by VESTERGAARD
                </span>
            )}
        </div>
    );
}

