interface SectionTagProps {
    title: string;
    className?: string;
}

export function SectionTag({ title, className = "" }: SectionTagProps) {
    return (
        <div className={`inline-flex items-center bg-bg-panel border-l-4 border-brand-orange px-4 py-1 clip-slant ${className}`}>
            <span className="font-display text-lg uppercase tracking-wider text-brand-amber">
                {title}_
            </span>
        </div>
    );
}