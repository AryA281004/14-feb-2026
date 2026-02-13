'use client';

import { useEffect, useState, useMemo, useRef, memo } from 'react';
import { GalleryCard, fetchGalleryCards, isGalleryEnabled } from '../lib/supabase';
import { DEMO_CARDS } from '../utils/demoData';
import Image from 'next/image';
import { Stroke } from '../utils/encode';
import { m, LazyMotion, domAnimation } from 'framer-motion';

// Canvas-based preview component with textured stroke (same algorithm as DrawCanvas)
const TexturedPreview = memo(function TexturedPreview({ strokes }: { strokes: Stroke[] }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!canvasRef.current || !containerRef.current || !strokes || strokes.length === 0) return;

        const canvas = canvasRef.current;
        const container = containerRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Get container dimensions
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        ctx.scale(dpr, dpr);

        // Calculate bounds from all stroke points
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        strokes.forEach(stroke => {
            stroke.path.forEach(p => {
                minX = Math.min(minX, p.x);
                minY = Math.min(minY, p.y);
                maxX = Math.max(maxX, p.x);
                maxY = Math.max(maxY, p.y);
            });
        });

        if (!isFinite(minX)) return;

        // Add padding
        const padding = 20;
        minX = Math.max(0, minX - padding);
        minY = Math.max(0, minY - padding);
        const drawWidth = maxX - minX + padding * 2;
        const drawHeight = maxY - minY + padding * 2;

        // Calculate scale to fit in container
        const scale = Math.min(rect.width / drawWidth, rect.height / drawHeight);
        const offsetX = (rect.width - drawWidth * scale) / 2 - minX * scale;
        const offsetY = (rect.height - drawHeight * scale) / 2 - minY * scale;

        // Clear canvas
        ctx.clearRect(0, 0, rect.width, rect.height);

        // Textured stroke algorithm (same as DrawCanvas)
        const BRUSH_COLOR = "rgba(255, 45, 85, 0.25)";
        const drawTexturedStroke = (from: { x: number, y: number }, to: { x: number, y: number }) => {
            const dist = Math.hypot(to.x - from.x, to.y - from.y);
            const angle = Math.atan2(to.y - from.y, to.x - from.x);

            const stepSize = 0.5;
            const radius = 9 * scale;
            const density = 15;

            ctx.strokeStyle = BRUSH_COLOR;
            ctx.lineWidth = 0.8 * scale;

            for (let i = 0; i < dist; i += stepSize) {
                const centerX = from.x + (Math.cos(angle) * i);
                const centerY = from.y + (Math.sin(angle) * i);

                for (let j = 0; j < density; j++) {
                    const r = Math.random() * radius;
                    const theta = Math.random() * Math.PI * 2;

                    const startX = centerX + Math.cos(theta) * r;
                    const startY = centerY + Math.sin(theta) * r;

                    const scratchLen = (Math.random() * 3 + 1) * scale;
                    const scratchAngle = Math.random() * Math.PI * 2;

                    ctx.beginPath();
                    ctx.moveTo(startX * scale + offsetX, startY * scale + offsetY);
                    ctx.lineTo(
                        (startX + Math.cos(scratchAngle) * scratchLen / scale) * scale + offsetX,
                        (startY + Math.sin(scratchAngle) * scratchLen / scale) * scale + offsetY
                    );
                    ctx.stroke();
                }
            }
        };

        // Draw all strokes
        strokes.forEach(stroke => {
            if (stroke.path.length < 2) return;
            for (let i = 1; i < stroke.path.length; i++) {
                drawTexturedStroke(stroke.path[i - 1], stroke.path[i]);
            }
        });
    }, [strokes]);

    if (!strokes || strokes.length === 0) return null;

    return (
        <div ref={containerRef} className="w-full h-full absolute inset-0">
            <canvas ref={canvasRef} className="w-full h-full" />
        </div>
    );
});

// SVG mini preview with dynamic viewBox for gallery grid cards
const GalleryCardPreview = memo(function GalleryCardPreview({ strokes }: { strokes: Stroke[] }) {
    const viewBoxData = useMemo(() => {
        if (!strokes || strokes.length === 0) return null;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        strokes.forEach(stroke => {
            stroke.path.forEach(p => {
                minX = Math.min(minX, p.x);
                minY = Math.min(minY, p.y);
                maxX = Math.max(maxX, p.x);
                maxY = Math.max(maxY, p.y);
            });
        });

        if (!isFinite(minX)) return null;

        const padding = 15;
        minX = Math.max(0, minX - padding);
        minY = Math.max(0, minY - padding);
        const width = Math.max(50, maxX - minX + padding * 2);
        const height = Math.max(50, maxY - minY + padding * 2);

        return { minX, minY, width, height };
    }, [strokes]);

    if (!viewBoxData) return null;

    const { minX, minY, width, height } = viewBoxData;

    return (
        <svg
            viewBox={`${minX} ${minY} ${width} ${height}`}
            preserveAspectRatio="xMidYMid meet"
            className="w-full h-full absolute inset-0 pointer-events-none"
        >
            {strokes.map((stroke, i) => (
                <path
                    key={i}
                    d={`M ${stroke.path.map(p => `${p.x},${p.y}`).join(' L ')}`}
                    stroke={stroke.color || '#FF2D55'}
                    strokeWidth={Math.max(3, width / 60)}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.7}
                />
            ))}
        </svg>
    );
});

const GALLERY_QUOTES = [
    "Never above you. Never below you. Always beside you.",
    "I love you very much, probably more than anybody could love another person.",
    "I hope you don't mind that I put down in words how wonderful life is while you're in the world.",
    "My heart to you is given, oh do give yours to me; We’ll lock them up together, and throw away the key.",
    "I vow to fiercely love you in all your forms, now and forever.",
    "Love is being stupid together.",
    "In a world full of temporary things, you are my forever."
];

interface GalleryProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Gallery({ isOpen, onClose }: GalleryProps) {
    const [cards, setCards] = useState<GalleryCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCard, setSelectedCard] = useState<GalleryCard | null>(null);

    // Check if gallery is enabled
    const galleryEnabled = useMemo(() => isGalleryEnabled(), []);

    const randomQuote = useMemo(() => {
        if (!selectedCard) return "";
        return GALLERY_QUOTES[Math.floor(Math.random() * GALLERY_QUOTES.length)];
    }, [selectedCard]);

    useEffect(() => {
        if (!isOpen || !galleryEnabled) {
            return;
        }

        const loadCards = async () => {
            setLoading(true);
            try {
                const data = await fetchGalleryCards();
                // Combine demo cards with fetched cards
                // Cast helper created strokes to actual Stroke type if needed, but TS should be fine
                const demoCards: GalleryCard[] = DEMO_CARDS.map(d => ({
                    ...d,
                    drawing: d.drawing.map(s => ({
                        color: s.color,
                        path: s.path.map(p => ({ x: p.x, y: p.y }))
                    }))
                }));

                setCards([...demoCards, ...data]);
            } catch (e) {
                setError('Failed to load gallery');
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadCards();
    }, [isOpen, galleryEnabled]);

    // Don't render if not open
    if (!isOpen) return null;

    // Gallery not configured - show message
    if (!galleryEnabled) {
        return (
            <div className="fixed inset-0 z-85 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
                <div className="bg-white rounded-3xl p-8 max-w-md text-center" onClick={e => e.stopPropagation()}>
                    <div className="text-4xl mb-4">⚙️</div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2">Gallery Not Configured</h3>
                    <p className="text-gray-500 mb-6">Add your Supabase credentials to enable the gallery.</p>
                    <button onClick={onClose} className="text-[#FF2D55] font-bold">Close</button>
                </div>
            </div>
        );
    }

    return (
        <LazyMotion features={domAnimation}>
            <div className="fixed inset-0 z-85 bg-black/40 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
                <m.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute left-4 right-4 top-4 bottom-4 md:left-8 md:right-8 md:bottom-8 bg-[#f8f8f8] rounded-lg shadow-2xl flex flex-col border-2 border-dashed border-[#FF2D55] overflow-hidden"
                    onClick={e => e.stopPropagation()}
                    style={{
                        backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                    }}
                >
                    {/* Close Button */}
                    <div className="absolute top-4 right-4 z-30">
                        <button
                            onClick={onClose}
                            className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center text-lg font-bold hover:scale-105 transition-all shadow-md"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Scrollable Content Area */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                        {/* Gallery Header */}
                        <div className="mb-8 mt-2 text-left">
                            <h2 className="text-xl font-bold text-black mb-1">Community Gallery 💝</h2>
                            <p className="text-sm text-gray-500 font-medium">See what others are creating for their Valentines!</p>
                        </div>

                        {/* Loading State */}
                        {loading && (
                            <div className="w-full py-12 text-center">
                                <div className="inline-block w-8 h-8 border-4 border-[#FF2D55] border-t-transparent rounded-full animate-spin"></div>
                                <p className="mt-4 text-gray-500 font-medium">Loading Gallery...</p>
                            </div>
                        )}

                        {/* Error State */}
                        {!loading && error && (
                            <div className="w-full py-12 text-center">
                                <div className="text-4xl mb-4">⚠️</div>
                                <p className="text-gray-500">{error}</p>
                            </div>
                        )}

                        {/* Empty State - Minimal */}
                        {!loading && !error && cards.length === 0 && (
                            <div className="w-full py-12 text-center">
                                <p className="text-gray-400">No cards yet. Be the first!</p>
                            </div>
                        )}

                        {/* Card Grid */}
                        {!loading && !error && cards.length > 0 && (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {cards.map((card, index) => (
                                    <m.div
                                        key={card.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: Math.min(index * 0.05, 0.5) }}
                                        onClick={() => setSelectedCard(card)}
                                        className="relative bg-white rounded-xl border border-gray-200 transition-all cursor-pointer group overflow-hidden"
                                    >

                                        {/* Mini Card */}
                                        <div className="text-center p-3">

                                            <div className="aspect-square bg-[#f8f8f8] rounded-lg overflow-hidden flex items-center justify-center relative">
                                                <div className="absolute inset-0" style={{
                                                    backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)',
                                                    backgroundSize: '10px 10px'
                                                }}></div>
                                                <GalleryCardPreview strokes={card.drawing} />
                                            </div>

                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mt-3 mb-1">
                                                TO {card.receiver}
                                            </p>
                                            <p className="text-sm text-gray-600 font-bold truncate" style={{ fontFamily: '"Chewy", cursive' }}>
                                                Love, {card.sender}
                                            </p>
                                        </div>
                                    </m.div>
                                ))}
                            </div>
                        )}
                    </div>
                </m.div>

                {/* Modal for Selected Card */}
                {selectedCard && (
                    <div
                        className="fixed inset-0 z-95 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setSelectedCard(null)}
                    >
                        <m.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-md bg-rose-50 rounded-2xl p-8 shadow-2xl overflow-hidden"
                        >
                            {/* Decorations */}
                            <Image src="/bow.webp" alt="will you be my valentine" width={64} height={64} className="absolute top-0 left-0 z-20 -rotate-20" />
                            <Image src="/avocado.svg" alt="will you be my valentine sticker" width={56} height={56} className="absolute bottom-0 left-2 z-20" />
                            <Image src="/love.svg" alt="will you be my valentine" width={128} height={128} className="absolute bottom-26 -right-6 opacity-30" />
                            <Image src="/love.svg" alt="will you be my valentine" width={128} height={128} className="absolute -bottom-6 -right-6 opacity-30" />

                            <Image src="/heart.webp" alt="will you be my valentine heart" width={32} height={32} className="absolute top-30 right-4 z-20 -rotate-10" />
                            <Image src="/ily.webp" alt="will you be my valentine i love you" width={32} height={32} className="absolute bottom-32 left-6 z-20 rotate-10" />
                            {/* Close Button - Heart Style */}
                            <button
                                onClick={() => setSelectedCard(null)}
                                className="absolute top-1 right-1 z-30 w-10 h-10 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 text-black text-xl"
                            >
                                ✕
                            </button>

                            {/* Card Content */}
                            <div className="text-center relative z-10 pt-4">
                                <p className="text-gray-800 text-sm font-bold mb-6 italic px-8">
                                    &quot;{randomQuote}&quot;
                                </p>
                                <div className="h-64 bg-white rounded-2xl overflow-hidden border-2 border-dashed border-gray-100 flex items-center justify-center mb-6 relative">
                                    <div className="absolute inset-0 opacity-30" style={{
                                        backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)',
                                        backgroundSize: '20px 20px'
                                    }}></div>
                                    <TexturedPreview strokes={selectedCard.drawing} />
                                </div>
                                <div className="flex flex-col items-center">
                                    <div className="flex flex-wrap justify-center items-baseline gap-x-3 gap-y-1">
                                        <span className="text-gray-500 text-sm">for</span>
                                        <span className="text-4xl text-[#FF2D55]" style={{ fontFamily: '"Chewy", cursive' }}>{selectedCard.receiver},</span>
                                    </div>
                                    <div className="flex flex-wrap justify-center items-baseline gap-x-3 gap-y-1 mt-1">
                                        <span className="text-gray-500 text-sm ">from</span>
                                        <span className="text-2xl text-gray-600" style={{ fontFamily: '"Chewy", cursive' }}>{selectedCard.sender}</span>
                                    </div>
                                </div>
                            </div>
                        </m.div>
                    </div>
                )}

            </div >
        </LazyMotion >
    );
}
