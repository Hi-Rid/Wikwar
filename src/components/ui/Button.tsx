import React from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    className?: string;
    children: React.ReactNode;
}

export function Button({
    variant = "primary",
    className = "",
    children,
    ...props
}: ButtonProps) {
    const baseStyle =
        "relative inline-flex items-center justify-center px-8 py-3 font-sans font-bold uppercase italic tracking-wider transition-all duration-150 ease-in-out clip-slant focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-bg-base disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary:
            "bg-gradient-primary text-bg-base shadow-[0_0_20px_rgba(255,106,0,0.6)] hover:shadow-[0_0_30px_rgba(255,106,0,0.9)] hover:-translate-y-0.5",
        secondary:
            "bg-bg-panel text-text-main border border-brand-orange hover:bg-brand-orange/10 hover:shadow-glow-orange",
        ghost:
            "bg-transparent text-brand-amber hover:text-brand-orange hover:bg-brand-orange/5",
    };

    return (
        <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
            {/* Ornamen garis miring di dalam tombol */}
            <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-white/30 clip-slant"></span>
            <span className="relative z-10">{children}</span>
        </button>
    );
}