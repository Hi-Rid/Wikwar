interface KeyCapProps {
    label: string;
}

export function KeyCap({ label }: KeyCapProps) {
    return (
        <span className="inline-flex items-center justify-center min-w-[32px] h-8 px-2 bg-bg-panel border border-text-muted/50 text-text-main font-sans font-bold text-sm clip-chamfer shadow-sm">
            {label}
        </span>
    );
}