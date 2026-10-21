"use client";

import { useLayoutEffect, useState, useRef } from "react";

export function ScaledStage({ children }: { children: React.ReactNode }) {
    const [scale, setScale] = useState(1);
    const stageRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const handleResize = () => {
            const s = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
            setScale(s);
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        window.addEventListener("fullscreenchange", handleResize);
        window.addEventListener("orientationchange", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("fullscreenchange", handleResize);
            window.removeEventListener("orientationchange", handleResize);
        };
    }, []);

    return (
        <div className="fixed inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
            <div
                ref={stageRef}
                data-testid="stage"
                className="relative pointer-events-auto"
                style={{
                    width: 1280,
                    height: 720,
                    transformOrigin: "center center",
                    transform: `scale(${scale})`,
                }}
            >
                {children}
            </div>
        </div>
    );
}