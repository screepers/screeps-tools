export const screepsWorlds: {[key: string]: string} = {
    mmo: 'MMO',
    season: 'Season',
};

export enum CacheKey {
    Body = 'body',
    Boost = 'boost',
    Terrain = 'terrain',
    Room = 'room',
    World = 'world',
    Shard = 'shard',
    Brush = 'brush',
    RCL = 'rcl',
    Structures = 'structures',
    Sources = 'sources',
    Mineral = 'minearl',
    ShowStats = 'showStats',
}

interface CacheValues {
    [CacheKey.Body]: {[prop: string]: number};
    [CacheKey.Boost]: {[prop: string]: string | null};
    [CacheKey.Terrain]: TerrainMap;
    [CacheKey.Room]: string;
    [CacheKey.World]: string;
    [CacheKey.Shard]: string;
    [CacheKey.Brush]: string;
    [CacheKey.RCL]: number;
    [CacheKey.Structures]: {[structure: string]: {x: number; y: number;}[]};
    [CacheKey.Sources]: {x: number; y: number;}[];
    [CacheKey.Mineral]: {[mineralType: string]: {x: number; y: number;}};
    [CacheKey.ShowStats]: boolean;
}

interface CacheUtil {
    set: <T extends CacheKey>(key: T, object: CacheValues[T]) => void;
    get: <T extends CacheKey>(key: T) => CacheValues[T];
    remove: (key: CacheKey) => void;
    removeAll: () => void;
}

export const cacheUtil: CacheUtil = {
    set: (key, object) => {
        localStorage.setItem(key, JSON.stringify(object));
    },
    get: key => {
        const saved = localStorage.getItem(key);
        return (saved !== null ? JSON.parse(saved) : null);
    },
    remove: (key) => localStorage.removeItem(key),
    removeAll: () => localStorage.clear(),
};