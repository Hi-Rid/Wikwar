export type TileId = "arcade" | "quick" | "training" | "howto" | "roster" | "settings";

export interface MenuTileData {
    id: TileId;
    title: string;
    subtitle?: string;
    className: string; // Ganti colSpan/rowSpan jadi className biar gampang
    variant: "primary" | "dark";
    neighbors: { up?: TileId; down?: TileId; left?: TileId; right?: TileId; };
}

export const MENU_TILES: MenuTileData[] = [
    { id: "arcade", title: "ARCADE", subtitle: "4 rivals + Boss Guru", className: "col-span-2 row-span-2", variant: "primary", neighbors: { down: "training", right: "quick" } },
    { id: "quick", title: "QUICK MATCH", subtitle: "1v1 vs random foe", className: "col-span-1 row-span-2", variant: "dark", neighbors: { down: "howto", left: "arcade" } },
    { id: "training", title: "TRAINING", subtitle: "Practice your combos", className: "col-span-2 row-span-1", variant: "dark", neighbors: { up: "arcade", right: "howto", down: "roster" } },
    { id: "howto", title: "HOW TO PLAY", className: "col-span-1 row-span-1", variant: "dark", neighbors: { up: "quick", left: "training", down: "settings" } },
    { id: "roster", title: "ROSTER", subtitle: "Select Character", className: "col-span-2 row-span-1", variant: "dark", neighbors: { up: "training", right: "settings" } },
    { id: "settings", title: "SETTINGS", className: "col-span-1 row-span-1", variant: "dark", neighbors: { up: "howto", left: "roster" } },
];