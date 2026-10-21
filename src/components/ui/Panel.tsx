import React from "react";

interface PanelProps {
    children: React.ReactNode;
    className?: string;
}

export function Panel({ children, className = "" }: PanelProps) {
    return (
        <div
            className={`relative bg-bg-panel/80 backdrop-blur-sm border border-brand-orange/30 clip-chamfer p-6 ${className}`}
        >
            {/* Ornamen sudut */}
            <div className="absolute top-0 right-0 w-8 h-8 bg-halftone bg-[length:4px_4px] opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-12 h-1 bg-brand-orange"></div>

            {children}
        </div>
    );
}