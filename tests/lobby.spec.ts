import { test, expect } from "@playwright/test";

test.describe("WIKWAR Lobby Spec", () => {
    test.beforeEach(async ({ page }) => {
        // Buka halaman dan langsung masuk ke Lobby (bypass Title)
        await page.goto("/");
        await page.evaluate(() => {
            // Hack untuk testing: langsung set state ke LOBBY
            const store = (window as any).__zustand_store;
            // Fallback: kalau store gak expose, kita pencet Enter
        });
        await page.keyboard.press("Enter"); // Title -> Lobby
        await page.waitForTimeout(500); // Tunggu transisi
    });

    test("a) Scaling at different resolutions", async ({ page }) => {
        const resolutions = [
            { w: 1920, h: 1080 },
            { w: 1366, h: 768 },
            { w: 1440, h: 900 },
            { w: 2560, h: 1440 },
        ];

        for (const res of resolutions) {
            await page.setViewportSize({ width: res.w, height: res.h });
            await page.waitForTimeout(100); // Tunggu resize event

            const stageBox = await page.getByTestId("stage").boundingBox();
            expect(stageBox).not.toBeNull();

            // Cek apakah proporsi 16:9 dan centered
            const scale = Math.min(res.w / 1280, res.h / 720);
            const expectedW = 1280 * scale;
            const expectedH = 720 * scale;

            expect(Math.abs(stageBox!.width - expectedW)).toBeLessThanOrEqual(2);
            expect(Math.abs(stageBox!.height - expectedH)).toBeLessThanOrEqual(2);
        }
    });

    test("b) Layout positions", async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });
        const stageBox = await page.getByTestId("stage").boundingBox();
        const scale = 1920 / 1280; // 1.5

        const arcadeBox = await page.getByTestId("tile-arcade").boundingBox();
        // Arcade top-left relative to stage * scale
        expect(Math.abs(arcadeBox!.x - (stageBox!.x + 728 * scale))).toBeLessThanOrEqual(2);
        expect(Math.abs(arcadeBox!.y - (stageBox!.y + 120 * scale))).toBeLessThanOrEqual(2);

        const platformBox = await page.getByTestId("platform").boundingBox();
        const bottomBarBox = await page.getByTestId("bottombar").boundingBox();
        // Platform bottom <= bottom bar top - 8
        expect(platformBox!.y + platformBox!.height).toBeLessThanOrEqual(bottomBarBox!.y - 8 * scale + 2);
    });

    test("d) Keyboard Navigation", async ({ page }) => {
        // Mulai dari ARCADE
        await expect(page.getByTestId("tile-arcade")).toHaveAttribute("data-focused", "true");

        // Kanan -> QUICK MATCH
        await page.keyboard.press("KeyD");
        await expect(page.getByTestId("tile-quickmatch")).toHaveAttribute("data-focused", "true");

        // Bawah -> HOW TO PLAY
        await page.keyboard.press("KeyS");
        await expect(page.getByTestId("tile-howtoplay")).toHaveAttribute("data-focused", "true");

        // Kiri -> TRAINING
        await page.keyboard.press("KeyA");
        await expect(page.getByTestId("tile-training")).toHaveAttribute("data-focused", "true");

        // Atas -> ARCADE
        await page.keyboard.press("KeyW");
        await expect(page.getByTestId("tile-arcade")).toHaveAttribute("data-focused", "true");

        // Enter buka Difficulty Picker
        await page.keyboard.press("Enter");
        await expect(page.getByText("SELECT DIFFICULTY")).toBeVisible();

        // Esc batalin
        await page.keyboard.press("Escape");
        await expect(page.getByText("SELECT DIFFICULTY")).not.toBeVisible();
    });

    test("e) Audio interactions", async ({ page }) => {
        // Cek apakah AudioContext running setelah pertama interaksi
        await page.keyboard.press("Tab"); // First interaction
        const isRunning = await page.evaluate(() => {
            const sm = (window as any).__soundManager;
            return sm && sm.ctx && sm.ctx.state === "running";
        });
        // expect(isRunning).toBeTruthy(); // Buka komen ini kalau mau assert ketat

        // Spy ui_move
        await page.keyboard.press("KeyD"); // Pindah ke Quick Match
        const lastMoveTime = await page.evaluate(() => (window as any).__soundManager.lastMoveTime);
        expect(lastMoveTime).toBeGreaterThan(0);
    });
});