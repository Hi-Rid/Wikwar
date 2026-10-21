# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\lobby.spec.ts >> WIKWAR Lobby Spec >> e) Audio interactions
- Location: tests\lobby.spec.ts:86:9

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | 
  3   | test.describe("WIKWAR Lobby Spec", () => {
  4   |     test.beforeEach(async ({ page }) => {
  5   |         // Buka halaman dan langsung masuk ke Lobby (bypass Title)
> 6   |         await page.goto("/");
      |                    ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  7   |         await page.evaluate(() => {
  8   |             // Hack untuk testing: langsung set state ke LOBBY
  9   |             const store = (window as any).__zustand_store;
  10  |             // Fallback: kalau store gak expose, kita pencet Enter
  11  |         });
  12  |         await page.keyboard.press("Enter"); // Title -> Lobby
  13  |         await page.waitForTimeout(500); // Tunggu transisi
  14  |     });
  15  | 
  16  |     test("a) Scaling at different resolutions", async ({ page }) => {
  17  |         const resolutions = [
  18  |             { w: 1920, h: 1080 },
  19  |             { w: 1366, h: 768 },
  20  |             { w: 1440, h: 900 },
  21  |             { w: 2560, h: 1440 },
  22  |         ];
  23  | 
  24  |         for (const res of resolutions) {
  25  |             await page.setViewportSize({ width: res.w, height: res.h });
  26  |             await page.waitForTimeout(100); // Tunggu resize event
  27  | 
  28  |             const stageBox = await page.getByTestId("stage").boundingBox();
  29  |             expect(stageBox).not.toBeNull();
  30  | 
  31  |             // Cek apakah proporsi 16:9 dan centered
  32  |             const scale = Math.min(res.w / 1280, res.h / 720);
  33  |             const expectedW = 1280 * scale;
  34  |             const expectedH = 720 * scale;
  35  | 
  36  |             expect(Math.abs(stageBox!.width - expectedW)).toBeLessThanOrEqual(2);
  37  |             expect(Math.abs(stageBox!.height - expectedH)).toBeLessThanOrEqual(2);
  38  |         }
  39  |     });
  40  | 
  41  |     test("b) Layout positions", async ({ page }) => {
  42  |         await page.setViewportSize({ width: 1920, height: 1080 });
  43  |         const stageBox = await page.getByTestId("stage").boundingBox();
  44  |         const scale = 1920 / 1280; // 1.5
  45  | 
  46  |         const arcadeBox = await page.getByTestId("tile-arcade").boundingBox();
  47  |         // Arcade top-left relative to stage * scale
  48  |         expect(Math.abs(arcadeBox!.x - (stageBox!.x + 728 * scale))).toBeLessThanOrEqual(2);
  49  |         expect(Math.abs(arcadeBox!.y - (stageBox!.y + 120 * scale))).toBeLessThanOrEqual(2);
  50  | 
  51  |         const platformBox = await page.getByTestId("platform").boundingBox();
  52  |         const bottomBarBox = await page.getByTestId("bottombar").boundingBox();
  53  |         // Platform bottom <= bottom bar top - 8
  54  |         expect(platformBox!.y + platformBox!.height).toBeLessThanOrEqual(bottomBarBox!.y - 8 * scale + 2);
  55  |     });
  56  | 
  57  |     test("d) Keyboard Navigation", async ({ page }) => {
  58  |         // Mulai dari ARCADE
  59  |         await expect(page.getByTestId("tile-arcade")).toHaveAttribute("data-focused", "true");
  60  | 
  61  |         // Kanan -> QUICK MATCH
  62  |         await page.keyboard.press("KeyD");
  63  |         await expect(page.getByTestId("tile-quickmatch")).toHaveAttribute("data-focused", "true");
  64  | 
  65  |         // Bawah -> HOW TO PLAY
  66  |         await page.keyboard.press("KeyS");
  67  |         await expect(page.getByTestId("tile-howtoplay")).toHaveAttribute("data-focused", "true");
  68  | 
  69  |         // Kiri -> TRAINING
  70  |         await page.keyboard.press("KeyA");
  71  |         await expect(page.getByTestId("tile-training")).toHaveAttribute("data-focused", "true");
  72  | 
  73  |         // Atas -> ARCADE
  74  |         await page.keyboard.press("KeyW");
  75  |         await expect(page.getByTestId("tile-arcade")).toHaveAttribute("data-focused", "true");
  76  | 
  77  |         // Enter buka Difficulty Picker
  78  |         await page.keyboard.press("Enter");
  79  |         await expect(page.getByText("SELECT DIFFICULTY")).toBeVisible();
  80  | 
  81  |         // Esc batalin
  82  |         await page.keyboard.press("Escape");
  83  |         await expect(page.getByText("SELECT DIFFICULTY")).not.toBeVisible();
  84  |     });
  85  | 
  86  |     test("e) Audio interactions", async ({ page }) => {
  87  |         // Cek apakah AudioContext running setelah pertama interaksi
  88  |         await page.keyboard.press("Tab"); // First interaction
  89  |         const isRunning = await page.evaluate(() => {
  90  |             const sm = (window as any).__soundManager;
  91  |             return sm && sm.ctx && sm.ctx.state === "running";
  92  |         });
  93  |         // expect(isRunning).toBeTruthy(); // Buka komen ini kalau mau assert ketat
  94  | 
  95  |         // Spy ui_move
  96  |         await page.keyboard.press("KeyD"); // Pindah ke Quick Match
  97  |         const lastMoveTime = await page.evaluate(() => (window as any).__soundManager.lastMoveTime);
  98  |         expect(lastMoveTime).toBeGreaterThan(0);
  99  |     });
  100 | });
```