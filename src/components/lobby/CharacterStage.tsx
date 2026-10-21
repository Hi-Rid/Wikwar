"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export function CharacterStage() {
    return (
        <div className="absolute left-[316px] top-[100px] w-[388px] h-[540px] z-10">

            {/* Platform (Berdiri pas di y=504, tinggi 44px) */}
            <div className="absolute left-[194px] top-[504px] w-[300px] h-[44px] bg-[#14141A] border-2 border-brand-orange/80 clip-bento -translate-x-1/2 shadow-[0_0_20px_rgba(255,106,0,0.3)]">
                <div className="absolute top-0 w-full h-[2px] bg-brand-orange shadow-[0_0_15px_#FF6A00]" />
            </div>

            {/* Glow bawah */}
            <div className="absolute left-[194px] top-[530px] w-[200px] h-[20px] bg-brand-orange/40 blur-[15px] rounded-full -translate-x-1/2" />

            {/* Character (Feet pas di y=500, jadi bottom-nya 540-500 = 40px) */}
            <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="absolute left-1/2 bottom-[40px] w-[280px] h-[400px] -translate-x-1/2 z-20 drop-shadow-[0_15px_25px_rgba(0,0,0,0.8)]"
            >
                <Image src="/assets/characters/char_1/ridho.png" alt="Ridho" fill className="object-contain object-bottom" priority />
            </motion.div>

            {/* Arrows */}
            <button className="absolute left-0 top-[260px] w-[48px] h-[64px] bg-bg-panel/80 border border-text-muted/30 clip-chamfer flex items-center justify-center text-2xl text-text-muted hover:text-brand-orange hover:border-brand-orange transition-colors">
                &lt;
            </button>
            <button className="absolute right-0 top-[260px] w-[48px] h-[64px] bg-bg-panel/80 border border-text-muted/30 clip-chamfer flex items-center justify-center text-2xl text-text-muted hover:text-brand-orange hover:border-brand-orange transition-colors">
                &gt;
            </button>
        </div>
    );
}