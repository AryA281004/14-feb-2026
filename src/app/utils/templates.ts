import { Stroke } from "./encode";

const RED = "rgba(255, 45, 85, 0.25)";

export interface Template {
    id: string;
    name: string;
    icon: string;
    strokes: Stroke[];
}

// Helper to create simple strokes
const createPath = (points: number[][]): Stroke => ({
    color: RED,
    path: points.map(([x, y]) => ({ x, y }))
});

// 1. Perfect Heart (Mathematical)
const generateHeart = (): Stroke[] => {
    const cx = 150, cy = 150, scale = 5;
    const points: { x: number, y: number }[] = [];
    for (let t = 0; t <= Math.PI * 2; t += 0.1) {
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        points.push({ x: cx + x * scale, y: cy + y * scale });
    }
    return [{ color: RED, path: points }];
};

// 2. I <3 U
const generateILoveU = (): Stroke[] => {
    return [
        // I
        createPath([[60, 100], [60, 200]]),
        createPath([[40, 100], [80, 100]]),
        createPath([[40, 200], [80, 200]]),
        // Heart
        createPath([[150, 130], [130, 110], [110, 130], [150, 180]]),
        createPath([[150, 130], [170, 110], [190, 130], [150, 180]]),
        // U
        createPath([[220, 100], [220, 170], [240, 200], [260, 170], [260, 100]])
    ];
};

// 3. Rose (Simplified)
const generateRose = (): Stroke[] => {
    return [
        // Bloom spiral
        createPath([[150, 150], [145, 140], [155, 135], [160, 145], [150, 155], [140, 145], [140, 130], [155, 120]]),
        // Petal left
        createPath([[140, 145], [130, 150], [135, 165], [150, 160]]),
        // Petal right
        createPath([[160, 145], [170, 150], [165, 165], [150, 160]]),
        // Stem
        createPath([[150, 160], [150, 220]]),
        // Leaf
        createPath([[150, 190], [170, 180], [160, 195], [150, 190]])
    ];
};

// 4. Love (Cursive-ish)
const generateLoveText = (): Stroke[] => {
    return [
        // L
        createPath([[50, 100], [50, 180], [90, 180]]),
        // o
        createPath([[100, 160], [100, 180], [120, 180], [120, 160], [100, 160]]),
        // v
        createPath([[130, 160], [140, 180], [150, 160]]),
        // e
        createPath([[160, 170], [180, 170], [180, 160], [160, 160], [160, 180], [180, 180]])
    ];
};



// 6. Envelope
const generateEnvelope = (): Stroke[] => {
    return [
        // Box
        createPath([[80, 100], [220, 100], [220, 200], [80, 200], [80, 100]]),
        // Flap
        createPath([[80, 100], [150, 160], [220, 100]])
    ];
};

// 7. Tulip
const generateTulip = (): Stroke[] => {
    return [
        // Flower cup
        createPath([[130, 120], [130, 150], [170, 150], [170, 120]]),
        createPath([[130, 120], [140, 140], [150, 120]]), // Petal 1
        createPath([[150, 120], [160, 140], [170, 120]]), // Petal 2
        // Stem
        createPath([[150, 150], [150, 220]]),
        // Leaves
        createPath([[150, 200], [130, 180], [150, 190]]),
        createPath([[150, 190], [170, 170], [150, 180]])
    ];
};

// 8. Lips
const generateLips = (): Stroke[] => {
    return [
        // Upper lip
        createPath([[80, 150], [120, 130], [150, 140], [180, 130], [220, 150]]),
        createPath([[80, 150], [150, 160], [220, 150]]),
        // Lower lip
        createPath([[90, 150], [150, 180], [210, 150]])
    ];
};

// 9. Infinity Heart
const generateInfinityHeart = (): Stroke[] => {
    // Draws an infinity symbol loop that morphs into a heart shape
    const points: { x: number, y: number }[] = [];
    for (let t = 0; t <= Math.PI * 2; t += 0.1) {
        const x = 150 + 60 * Math.sin(t);
        const y = 150 + 30 * Math.sin(2 * t);
        points.push({ x, y });
    }
    return [
        { color: RED, path: points },
        // Add a small heart in the center
        createPath([[150, 140], [140, 130], [150, 160], [160, 130], [150, 140]])
    ];
};

// 10. Cupid's Arrow
const generateCupidArrow = (): Stroke[] => {
    return [
        // Heart outline (rotated slightly)
        createPath([[120, 120], [100, 100], [120, 80], [150, 110], [180, 80], [200, 100], [180, 120], [150, 150], [120, 120]]),
        // Arrow shaft
        createPath([[50, 180], [250, 50]]),
        // Arrow head
        createPath([[240, 50], [250, 50], [250, 60]]),
        // Fletching
        createPath([[50, 180], [60, 190]]),
        createPath([[50, 180], [40, 170]])
    ];
};

// 11. Ring
const generateRing = (): Stroke[] => {
    return [
        // Band
        createPath([[110, 160], [110, 200], [190, 200], [190, 160], [110, 160]]), // Crude circle/oval
        // Diamond
        createPath([[150, 160], [130, 140], [150, 120], [170, 140], [150, 160]]),
        createPath([[130, 140], [170, 140]]) // Facet line
    ];
};


export const TEMPLATES: Template[] = [
    { id: 'heart', name: 'Perfect Heart', icon: '❤️', strokes: generateHeart() },
    { id: 'rose', name: 'Rose', icon: '🌹', strokes: generateRose() },
    { id: 'tulip', name: 'Tulip', icon: '🌷', strokes: generateTulip() },
    { id: 'lips', name: 'Kiss', icon: '💋', strokes: generateLips() },
    { id: 'love', name: 'Love', icon: '✍️', strokes: generateLoveText() },
    { id: 'ily', name: 'I <3 U', icon: '🤟', strokes: generateILoveU() },
    { id: 'infinity', name: 'Forever', icon: '∞', strokes: generateInfinityHeart() },
    { id: 'arrow', name: 'Cupid', icon: '🏹', strokes: generateCupidArrow() },
    { id: 'ring', name: 'Marry Me', icon: '💍', strokes: generateRing() },
    { id: 'envelope', name: 'Envelope', icon: '💌', strokes: generateEnvelope() }
];
