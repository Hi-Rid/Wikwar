"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { LobbyBackground } from "@/components/lobby/LobbyBackground";
import { TopBar } from "@/components/lobby/TopBar";
import { LeftColumn } from "@/components/lobby/LeftColumn";
import { CharacterStage } from "@/components/lobby/CharacterStage";
import { BentoGrid } from "@/components/lobby/BentoGrid";
import { BottomNav } from "@/components/lobby/BottomNav";

export function LobbyScreen() {
    // Dev-only check script
    useEffect(() => {
        if (process.env.NODE_ENV !== "development") return;
        const checkLayout = () => {
            let issues = 0;
            const tiles = document.querySelectorAll('[data-tile]');
            tiles.forEach((tile) => {
                const title = tile.querySelector('[data-title]');
                const icon = tile.querySelector('[data-icon]');
                if (title) {
                    if (title.scrollWidth > title.clientWidth + 1 || title.scrollHeight > title.clientHeight + 1) {
                        console.warn(`❌ [Overflow] Tile: ${tile.getAttribute('data-tile')} | Text: "${title.textContent}"`);
                        issues++;
                    }
                }
                if (title && icon) {
                    const tRect = title.getBoundingClientRect();
                    const iRect = icon.getBoundingClientRect();
                    const overlap = !(tRect.right < iRect.left || tRect.left > iRect.right || tRect.bottom < iRect.top || tRect.top > iRect.bottom);
                    if (overlap) {
                        console.warn(`❌ [Overlap] Tile: ${tile.getAttribute('data-tile')} | Text overlaps Icon`);
                        issues++;
                    }
                }
            });
            if (issues === 0) console.log("✅ [Layout Check] All text fits and no overlaps detected.");
        };
        const timer = setTimeout(checkLayout, 1000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="stage-wrapper">
            <motion.div
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="stage"
            >
                <LobbyBackground />

                {/* TopBar & BottomNav nggak gua sentuh, cuma diposisikan absolute biar aman */}
                <div className="absolute top-0 left-0 w-full z-30"><TopBar /></div>
                <div className="absolute bottom-0 left-0 w-full z-30"><BottomNav /></div>

                <LeftColumn />
                <CharacterStage />
                <BentoGrid />
            </motion.div>
        </div>
    );
}