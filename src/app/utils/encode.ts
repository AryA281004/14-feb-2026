import LZString from 'lz-string';

export interface Stroke {
    color: string;
    path: Array<{ x: number, y: number }>;
}

export const ROMANTIC_QUOTES = [
    "Every love story is beautiful, but ours is my favorite.",
    "You are my sun, my moon, and all my stars.",
    "I love you more than words can wield the matter, Dearer than eye-sight, space, and liberty.",
    "If I had a flower for every time I thought of you... I could walk through my garden forever.",
    "You are the finest, loveliest, tenderest, and most beautiful person I have ever known.",
    "My heart is and always will be yours.",
    "To the world you may be one person, but to one person you are the world.",
    "I saw that you were perfect, and so I loved you. Then I saw that you were not perfect and I loved you even more.",
    "You are my heart, my life, my one and only thought.",
    "I swear I couldn't love you more than I do right now, and yet I know I will tomorrow."
];

export interface ShareData {
    s: string; // sender name
    r?: string; // receiver name (optional for backward compatibility)
    d: Stroke[]; // drawing data
    q?: number; // quote index
}

export const encodeData = (data: ShareData): string => {
    const json = JSON.stringify(data);
    return LZString.compressToEncodedURIComponent(json);
};

export const decodeData = (encoded: string): ShareData | null => {
    try {
        const json = LZString.decompressFromEncodedURIComponent(encoded);
        if (!json) return null;
        return JSON.parse(json);
    } catch (e) {
        console.error("Failed to decode URL data", e);
        return null;
    }
};
