'use client';

import { useState, useEffect, memo, useRef } from 'react';
import Image from 'next/image';
import Navbar from './Navbar';
import DrawCanvas from './DrawCanvas';
import Gallery from './Gallery';
import GameInfoModal from './GameInfoModal';
import { Stroke, encodeData, ROMANTIC_QUOTES } from '../utils/encode';
import { saveCardToGallery, logCardCreation, saveSharedCard } from '../lib/supabase';
import RandomDucks from './RandomDucks';
import { RefreshCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

// Canvas-based preview component with the same textured stroke as DrawCanvas
const TexturedPreview = memo(function TexturedPreview({ strokes }: { strokes: Stroke[] }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!canvasRef.current || !containerRef.current || strokes.length === 0) return;

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

    if (strokes.length === 0) return null;

    return (
        <div ref={containerRef} className="w-full h-full absolute inset-0">
            <canvas ref={canvasRef} className="w-full h-full" />
        </div>
    );
});


export default function CreatorFlow() {
    const [showDraw, setShowDraw] = useState(false);
    const [showNameInput, setShowNameInput] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showGallery, setShowGallery] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [quoteIndex, setQuoteIndex] = useState(0);

    const [senderName, setSenderName] = useState('');
    const [receiverName, setReceiverName] = useState('');

    const [pendingStrokes, setPendingStrokes] = useState<Stroke[]>([]);
    const [shareUrl, setShareUrl] = useState('');

    // Gallery toggle
    const [shareToGallery, setShareToGallery] = useState(true);
    const [isShared, setIsShared] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (showShareModal) {
            confetti({
                particleCount: 200,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#FF2D55', '#FFB6C1', '#FFFFFF']
            });
        }
    }, [showShareModal]);

    const handleDrawingShare = (strokes: Stroke[]) => {
        setPendingStrokes(strokes);
        setQuoteIndex(Math.floor(Math.random() * ROMANTIC_QUOTES.length));
        setShowDraw(false);
        setShowPreview(true);
    };

    const generateLink = async () => {
        if (!senderName.trim() || !receiverName.trim()) return;
        setSaving(true);

        const trimmedSender = senderName.trim();
        const trimmedReceiver = receiverName.trim();

        // Log every card creation (for analytics)
        await logCardCreation(trimmedSender, trimmedReceiver);

        // Try short link via Supabase first
        const shortResult = await saveSharedCard(trimmedSender, trimmedReceiver, pendingStrokes, quoteIndex);

        let url: string;
        if (shortResult.success && shortResult.id) {
            // Short link! 🎉
            url = `${window.location.origin}/?id=${shortResult.id}`;
        } else {
            // Fallback to encoded data URL
            const data = {
                s: trimmedSender,
                r: trimmedReceiver,
                d: pendingStrokes,
                q: quoteIndex
            };
            const encoded = encodeData(data);
            url = `${window.location.origin}/?data=${encoded}`;
        }

        setShareUrl(url);

        // Save to gallery by default
        if (shareToGallery) {
            const result = await saveCardToGallery(trimmedSender, trimmedReceiver, pendingStrokes);
            if (result.success) {
                setIsShared(true);
            }
        }

        setSaving(false);
        setShowPreview(false);
        setShowNameInput(false);
        setShowShareModal(true);
    };

    const [isCopied, setIsCopied] = useState(false);

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
            // Fallback for older browsers or if permission denied
            const textArea = document.createElement("textarea");
            textArea.value = shareUrl;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            } catch (err) {
                console.error('Fallback copy failed', err);
            }
            document.body.removeChild(textArea);
        }
    };

    return (
        <>
            <RandomDucks />
            <Navbar
                onDrawClick={() => setShowDraw(true)}
                onGalleryClick={() => setShowGallery(true)}
                isDrawOpen={showDraw}
            />

            {/* Game Info Modal */}
            {showInfo && <GameInfoModal onClose={() => setShowInfo(false)} />}

            {/* Gallery Modal */}
            <Gallery isOpen={showGallery} onClose={() => setShowGallery(false)} />

            {/* Landing Hero Section */}
            {!showDraw && !showNameInput && !showShareModal && !showPreview && (
                <div className="flex flex-col items-center justify-center relative z-10 px-4 text-center">
                    <h1
                        className="text-5xl md:text-7xl text-[#FF2D55] mb-3 leading-tighter max-w-4xl mx-auto tracking-wide uppercase mt-20 md:mt-0 animate-in fade-in slide-in-from-bottom-5 duration-700"
                        style={{
                            fontFamily: '"Chewy", cursive',
                            textShadow: '3px 3px 0px #000000',
                            WebkitTextStroke: '1.5px black'
                        }}
                    >
                        Will you be my <br /> Valentine ?
                    </h1>

                    <div className="mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">

                        <p className="text-gray-800 text-sm md:text-base font-medium -mt-1">
                            ( It takes 2 minutes. They&#39;ll remember it forever)
                        </p>
                    </div>

                    <div className="w-full max-w-sm bg-white/40 backdrop-blur-md p-6 rounded-3xl border-2 border-white/50 shadow-xl animate-in fade-in zoom-in duration-700 delay-200 mt-12 md:mt-4">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-left text-[#FF2D55] font-bold mb-1 ml-1 text-sm uppercase tracking-wider">Who is this for?</label>
                                <input
                                    type="text"
                                    value={receiverName}
                                    onChange={(e) => setReceiverName(e.target.value)}
                                    placeholder="Their Name"
                                    className="w-full border-2 border-white/50 bg-white/60 rounded-xl p-3 focus:border-[#FF2D55] focus:outline-none focus:ring-2 focus:ring-[#FF2D55]/20 font-bold text-lg text-gray-800 placeholder:text-gray-400"
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => setShowDraw(true)}
                            disabled={!receiverName.trim()}
                            className="w-full bg-[#FF2D55] text-white font-bold py-3 rounded-full text-lg shadow-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6 transform hover:scale-[1.02]"
                        >
                            Create Valentine
                        </button>
                    </div>

                    {/* How it works - Bottom Center */}
                    <button
                        onClick={() => setShowInfo(true)}
                        className="fixed bottom-1 md:bottom-0.5 left-1/2 -translate-x-1/2 text-black font-medium text-sm underline underline-offset-4 transition-colors z-20"
                    >
                        How it works
                    </button>
                </div>
            )}

            {showDraw && (
                <DrawCanvas
                    onClose={() => setShowDraw(false)}
                    onShare={handleDrawingShare}
                />
            )}

            {/* Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 z-80 bg-black/10 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-white/80 backdrop-blur-xl p-0 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-300 relative border-2 border-white/50 overflow-hidden">
                        <div className="p-6 relative">
                            <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        setShowPreview(false);
                                        setShowDraw(true);
                                    }}
                                    className="bg-white/80 hover:bg-white text-black/70 hover:text-black rounded-full w-8 h-8 flex items-center justify-center shadow-sm transition-all border border-black/5"
                                    title="Redo Drawing"
                                >
                                    <RefreshCcw size={16} />
                                </button>
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="text-black/60 hover:text-black hover:bg-white/50 rounded-full w-8 h-8 flex items-center justify-center font-bold transition-all"
                                >
                                    ✕
                                </button>
                            </div>

                            <h3 className="text-sm font-bold mb-6 text-[#FF2D55] text-center uppercase tracking-widest drop-shadow-sm">Card Preview</h3>

                            <div className="bg-white rounded-xl p-5 shadow-sm mb-4 text-center border border-gray-100 transform rotate-1 relative overflow-hidden ring-4 ring-pink-50/50">
                                {/* Decorations */}
                                <Image src="/bow.webp" alt="will you be my valentine" width={48} height={48} className="absolute -top-3 -left-3 z-10 drop-shadow-md -rotate-20" />
                                <Image src="/heart.webp" alt="will you be my valentine heart" width={28} height={28} className="absolute top-3 right-4 z-20 -rotate-10" />
                                <Image src="/avocado.svg" alt="will you be my valentine sticker" width={48} height={48} className="absolute bottom-0 left-2 z-20" />
                                <Image src="/ily.webp" alt="will you be my valentine i love you" width={28} height={28} className="absolute bottom-28 left-4 z-20 rotate-10" />
                                <Image src="/love.svg" alt="will you be my valentine" width={112} height={112} className="absolute -bottom-6 -right-6 opacity-30 pointer-events-none" />

                                <p className="text-gray-800 text-sm font-bold mb-4 italic px-4">
                                    &quot;{ROMANTIC_QUOTES[quoteIndex]}&quot;
                                </p>

                                <div className="h-52 bg-white rounded-2xl overflow-hidden border-2 border-dashed border-gray-100 flex items-center justify-center mb-4 relative">
                                    <div className="absolute inset-0 opacity-30" style={{
                                        backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)',
                                        backgroundSize: '20px 20px'
                                    }}></div>
                                    {/* SVG-based preview with memoized bounds */}
                                    <TexturedPreview strokes={pendingStrokes} />
                                </div>

                                <div className="flex flex-col items-center relative z-20">
                                    <div className="flex flex-wrap justify-center items-baseline gap-x-2 gap-y-1">
                                        <span className="text-gray-500 text-xs">for</span>
                                        <span className="text-3xl text-[#FF2D55]" style={{ fontFamily: '"Chewy", cursive' }}>{receiverName},</span>
                                    </div>
                                    <div className="flex flex-wrap justify-center items-baseline gap-x-2 gap-y-1 mt-0">
                                        <span className="text-gray-500 text-xs ">from</span>
                                        <input
                                            type="text"
                                            value={senderName}
                                            onChange={(e) => setSenderName(e.target.value)}
                                            placeholder="Your Name"
                                            className="border-b-2 border-gray-300 focus:border-[#FF2D55] outline-none px-2 py-0 w-36 text-xl text-gray-600 placeholder:text-gray-300 bg-transparent text-center"
                                            style={{ fontFamily: '"Chewy", cursive' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => generateLink()}
                                disabled={!senderName.trim() || saving}
                                className="w-full bg-[#FF2D55] text-white font-bold py-3 rounded-full shadow-lg shadow-pink-200 hover:scale-[1.02] active:scale-[0.98] transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                        Generating...
                                    </>
                                ) : (
                                    'Create Link'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Share Link Modal */}
            {showShareModal && (
                <div className="fixed inset-0 z-80 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="w-full max-w-sm bg-white/90 backdrop-blur-lg p-0 rounded-3xl border-2 border-white/50 shadow-2xl text-center animate-in fade-in zoom-in duration-300 relative overflow-hidden">
                        {/* Decorative love icon */}
                        <Image src="/love.svg" alt="will you be my valentine" width={120} height={120} className="absolute -top-4 -right-10 opacity-30 pointer-events-none" />
                        <Image src="/love.svg" alt="will you be my valentine" width={120} height={120} className="absolute -bottom-4 -left-6 opacity-30 pointer-events-none" />

                        <div className="p-8">
                            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl border border-green-200 p-2">
                                <Image src="/heart.webp" alt="will you be my valentine" width={48} height={48} className="w-full h-full object-contain" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3 text-gray-900">Card Ready!</h3>
                            <div className="mb-8">
                                <p className="text-gray-700 font-medium">Special delivery for <span className="text-[#FF2D55] font-bold">{receiverName}</span></p>
                                <p className="text-gray-500 font-medium">Send it now and wait for the magic!</p>
                            </div>

                            <div className="bg-white p-3 rounded-2xl flex items-center gap-2 mb-6 border border-pink-50 shadow-inner group">
                                <input
                                    readOnly
                                    value={shareUrl}
                                    className="bg-transparent flex-1 text-sm text-gray-600 outline-none w-full font-mono"
                                />
                                <button
                                    onClick={copyToClipboard}
                                    className="bg-[#FF2D55] text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-sm"
                                >
                                    {isCopied ? "Copied!" : "Copy"}
                                </button>
                            </div>

                            {/* Minimalist Gallery Sharing */}
                            <div className="mb-8">
                                <label className="flex items-center justify-center gap-2 cursor-pointer group opacity-60 hover:opacity-100 transition-opacity">
                                    <input
                                        type="checkbox"
                                        checked={shareToGallery}
                                        onChange={async (e) => {
                                            setShareToGallery(e.target.checked);
                                            if (e.target.checked && !isShared) {
                                                setSaving(true);
                                                const res = await saveCardToGallery(senderName.trim(), receiverName.trim(), pendingStrokes);
                                                if (res.success) setIsShared(true);
                                                setSaving(false);
                                            }
                                        }}
                                        className="w-3 h-3 rounded border-gray-300 text-[#FF2D55] focus:ring-[#FF2D55] cursor-pointer accent-[#FF2D55]"
                                    />
                                    <span className="text-gray-400 text-[10px] font-medium tracking-tight">
                                        {isShared ? "Shared to public gallery" : "Post to public gallery"}
                                    </span>
                                </label>
                                {saving && !isShared && (
                                    <div className="text-[10px] text-gray-400 mt-1 animate-pulse italic">Syncing...</div>
                                )}
                            </div>

                            <button
                                onClick={() => setShowShareModal(false)}
                                className="w-full flex items-center justify-center gap-2 bg-white text-gray-600 hover:text-gray-800 font-bold text-xs uppercase tracking-widest py-4 px-8 rounded-2xl transition-all border border-gray-100"
                            >
                                Back to Home
                            </button>
                        </div>
                    </div>
                </div>
            )
            }
        </>
    );
}
