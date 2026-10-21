"use client";
import Image from "next/image";

export function LobbyBackground() {
    return (
        <div className="absolute inset-0 z-0 bg-[#0A0A0D]">
            {/* Path udah diganti ke wikrama.png */}
            <Image
                src="/assets/stages/wikrama.png"
                alt="Background"
                fill
                className="object-cover opacity-85 blur-[1px] saturate-75"
                priority
            />

            {/* Overlay Gelap tipis biar teks kebaca */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Gradient tipis di kiri & kanan */}
            <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-[#0A0A0D]/80 to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-[#0A0A0D]/80 to-transparent pointer-events-none" />
        </div>
    );
}