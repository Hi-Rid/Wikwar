// src/engine/sim/smoke.test.ts
import { describe, expect, it } from "vitest";

describe("F0-1: Vitest & sim guard smoke test", () => {
    it("runs pure TypeScript test in Node environment", () => {
        const fps = 60;
        expect(fps * 60).toBe(3600);
    });
});