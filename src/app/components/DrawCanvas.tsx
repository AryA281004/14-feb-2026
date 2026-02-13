'use client';

import { useRef, useEffect, useState } from "react";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { Wand2 } from "lucide-react";
import { TEMPLATES, Template } from "../utils/templates";

const MAX_MOVES = 5;
const BRUSH_COLOR = "rgba(255, 45, 85, 0.25)";

// Hotspot at 3 21
const CURSOR_URL = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M20.71 7.04c.39-.39.39-1.04 0-1.41l-2.34-2.34c-.37-.39-1.02-.39-1.41 0l-1.84 1.83 3.75 3.75 1.84-1.83zM3 17.25V21h3.75L17.81 9.93l-3.75-3.75L3 17.25z' fill='%231a1818'/%3E%3C/svg%3E") 3 21, auto`;

import { Stroke } from "../utils/encode";

interface DrawCanvasProps {
    onClose: () => void;
    readOnly?: boolean;
    initialData?: Stroke[];
    onShare?: (strokes: Stroke[]) => void;
}

export default function DrawCanvas({ onClose, readOnly = false, initialData, onShare }: DrawCanvasProps) {
    const [moves, setMoves] = useState(0);
    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const [showTemplates, setShowTemplates] = useState(false);
    const currentPath = useRef<{ x: number, y: number }[]>([]);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    // Make drawTexturedStroke available for pre-drawing
    // We define drawing logic inside the component to access context/params easily
    // or define it outside/helper if pure. It needs context.

    const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
    const lastPos = useRef<{ x: number, y: number } | null>(null);

    const [initialized, setInitialized] = useState(false);

    // "Textured Marker" / "Crayon" Algorithm
    const drawTexturedStroke = (ctx: CanvasRenderingContext2D, from: { x: number, y: number }, to: { x: number, y: number }, color = BRUSH_COLOR) => {
        const dist = Math.hypot(to.x - from.x, to.y - from.y);
        const angle = Math.atan2(to.y - from.y, to.x - from.x);

        const stepSize = 0.5;
        const radius = 9;
        const density = 15;

        ctx.strokeStyle = color;
        ctx.lineWidth = 0.8;

        for (let i = 0; i < dist; i += stepSize) {
            const centerX = from.x + (Math.cos(angle) * i);
            const centerY = from.y + (Math.sin(angle) * i);

            for (let j = 0; j < density; j++) {
                const r = Math.random() * radius;
                const theta = Math.random() * Math.PI * 2;

                const startX = centerX + Math.cos(theta) * r;
                const startY = centerY + Math.sin(theta) * r;

                const scratchLen = Math.random() * 3 + 1;
                const scratchAngle = Math.random() * Math.PI * 2;

                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(startX + Math.cos(scratchAngle) * scratchLen, startY + Math.sin(scratchAngle) * scratchLen);
                ctx.stroke();
            }
        }
    };

    const initCanvas = () => {
        if (canvasRef.current && containerRef.current && !initialized) {
            const canvas = canvasRef.current;
            const rect = containerRef.current.getBoundingClientRect();

            // Guard: ensure the container has dimensions
            if (rect.width === 0 || rect.height === 0) return;

            const dpr = window.devicePixelRatio || 1;
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;

            // canvas.style.width = `${rect.width}px`;
            // canvas.style.height = `${rect.height}px`;

            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.scale(dpr, dpr);
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                setContext(ctx);

                // Draw heart guide on initialization (but don't add to strokes)
                if (!readOnly && !initialData) {
                    drawHeartGuide(ctx, rect.width, rect.height);
                }

                setInitialized(true);
            }
        }
    };

    // For readOnly/embedded mode, initialize canvas on mount with a slight delay
    // to ensure container has rendered with dimensions
    useEffect(() => {
        if (readOnly && !initialized) {
            const timer = setTimeout(() => {
                initCanvas();
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [readOnly, initialized, initCanvas]);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const handleResize = () => {
            // Clear any pending resize handling
            clearTimeout(timeoutId);

            // Debounce by 100ms
            timeoutId = setTimeout(() => {
                setInitialized(false);
                if (canvasRef.current && containerRef.current) {
                    const canvas = canvasRef.current;
                    const rect = containerRef.current.getBoundingClientRect();
                    const dpr = window.devicePixelRatio || 1;
                    canvas.width = rect.width * dpr;
                    canvas.height = rect.height * dpr;

                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.scale(dpr, dpr);
                        ctx.lineCap = 'round';
                        ctx.lineJoin = 'round';
                        setContext(ctx);

                        // Re-draw heart guide and strokes on resize
                        if (!readOnly && !initialData) {
                            drawHeartGuide(ctx, rect.width, rect.height);
                        }

                        // Replay recorded strokes
                        strokes.forEach(stroke => {
                            if (stroke.path.length > 0) {
                                let p1 = stroke.path[0];
                                for (let i = 1; i < stroke.path.length; i++) {
                                    const p2 = stroke.path[i];
                                    drawTexturedStroke(ctx, p1, p2, stroke.color);
                                    p1 = p2;
                                }
                            }
                        });
                    }
                }
            }, 100);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timeoutId);
        };
    }, [strokes, initialData, readOnly]);

    // Initial Replay
    useEffect(() => {
        if (initialData && context && initialized) {
            // Wait for pre-draw
            const timer = setTimeout(() => {
                initialData.forEach((stroke, index) => {
                    setTimeout(() => {
                        if (stroke.path.length > 0) {
                            let p1 = stroke.path[0];
                            for (let i = 1; i < stroke.path.length; i++) {
                                const p2 = stroke.path[i];
                                drawTexturedStroke(context, p1, p2, stroke.color);
                                p1 = p2;
                            }
                        }
                    }, index * 10); // Much faster replay for preview
                });
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [context, initialData, initialized]);

    // Generate heart points for a given canvas size
    const generateHeartPoints = (width: number, height: number): { x: number, y: number }[] => {
        const cx = width / 2;
        const cy = height / 2;
        const scale = 3.5;

        const points: { x: number, y: number }[] = [];
        for (let t = 0; t <= Math.PI * 2; t += 0.1) {
            const x = 16 * Math.pow(Math.sin(t), 3);
            const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
            points.push({
                x: cx + x * scale,
                y: cy + y * scale
            });
        }
        // Close the loop
        if (points.length > 0) {
            points.push({ ...points[0] });
        }
        return points;
    };

    const drawHeartGuide = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        const points = generateHeartPoints(width, height);

        // Draw the heart visually
        if (points.length > 1) {
            let p1 = points[0];
            for (let i = 1; i < points.length; i++) {
                const p2 = points[i];
                drawTexturedStroke(ctx, p1, p2, BRUSH_COLOR);
                p1 = p2;
            }

            // Save the heart as the first stroke
            setStrokes(prev => {
                // Only add if not already present (prevent duplicates)
                if (prev.length === 0) {
                    return [{ color: BRUSH_COLOR, path: points }];
                }
                return prev;
            });
        }
    };

    const getPos = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (readOnly || moves >= MAX_MOVES || !context) return;
        setIsDrawing(true);
        const pos = getPos(e);
        lastPos.current = pos;
        currentPath.current = [pos]; // Start new path

        drawTexturedStroke(context, pos, { x: pos.x + 0.1, y: pos.y + 0.1 });
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !context || !lastPos.current) return;
        const currentPos = getPos(e);
        const dist = Math.hypot(currentPos.x - lastPos.current.x, currentPos.y - lastPos.current.y);
        if (dist < 1) return;

        drawTexturedStroke(context, lastPos.current, currentPos);
        currentPath.current.push(currentPos); // Store point

        lastPos.current = currentPos;
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            setMoves(prev => prev + 1);
            lastPos.current = null;

            // Save stroke - IMPORTANT: make a copy of the path array!
            if (currentPath.current.length > 0) {
                const pathCopy = currentPath.current.map(p => ({ x: p.x, y: p.y }));
                setStrokes(prev => [...prev, { color: BRUSH_COLOR, path: pathCopy }]);
            }
            currentPath.current = [];
        }
    };

    const handleReset = () => {
        if (context && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            context.clearRect(0, 0, rect.width, rect.height);
            // Don't redraw heart - user wanted blank canvas after reset
            setMoves(0);
            setStrokes([]);
        }
    };

    const handleTemplateSelect = (template: Template) => {
        if (context && containerRef.current) {
            // 1. Clear canvas and Reset
            const rect = containerRef.current.getBoundingClientRect();
            context.clearRect(0, 0, rect.width, rect.height);

            // 2. Calculate Centering Offset
            // Find bounding box of template strokes
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            let hasPoints = false;

            template.strokes.forEach(s => {
                s.path.forEach(p => {
                    minX = Math.min(minX, p.x);
                    maxX = Math.max(maxX, p.x);
                    minY = Math.min(minY, p.y);
                    maxY = Math.max(maxY, p.y);
                    hasPoints = true;
                });
            });

            let finalStrokes = template.strokes;

            if (hasPoints) {
                const templateCX = (minX + maxX) / 2;
                const templateCY = (minY + maxY) / 2;
                const canvasCX = rect.width / 2;
                const canvasCY = rect.height / 2;
                const offsetX = canvasCX - templateCX;
                const offsetY = canvasCY - templateCY;

                // Create new strokes with adjusted coordinates
                finalStrokes = template.strokes.map(s => ({
                    ...s,
                    path: s.path.map(p => ({
                        x: p.x + offsetX,
                        y: p.y + offsetY
                    }))
                }));
            }

            setStrokes(finalStrokes);
            setMoves(0);

            // 3. Animate drawing (Batched for smoothness)
            let strokeIndex = 0;

            const animateDrawing = () => {
                if (strokeIndex >= finalStrokes.length) return;

                const batchSize = 2;

                for (let i = 0; i < batchSize && strokeIndex < finalStrokes.length; i++) {
                    const stroke = finalStrokes[strokeIndex];
                    if (stroke.path.length > 0) {
                        let p1 = stroke.path[0];
                        for (let j = 1; j < stroke.path.length; j++) {
                            const p2 = stroke.path[j];
                            drawTexturedStroke(context, p1, p2, stroke.color);
                            p1 = p2;
                        }
                    }
                    strokeIndex++;
                }

                requestAnimationFrame(animateDrawing);
            };

            // Start animation
            requestAnimationFrame(animateDrawing);
            setShowTemplates(false);
        }
    };

    return (
        <LazyMotion features={domAnimation}>
            {/* Backdrop - Only show when NOT readOnly */}
            {!readOnly && (
                <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-65 bg-black/40 backdrop-blur-sm"
                    onClick={onClose}
                />
            )}

            {/* Template Selection Modal */}
            {showTemplates && (
                <div className="fixed inset-0 z-80 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setShowTemplates(false)}
                    />
                    <div
                        className="bg-white/95 rounded-3xl p-6 md:p-8 w-full max-w-sm md:max-w-2xl relative z-10 shadow-2xl border border-white/50 overflow-hidden"
                    >
                        {/* Background Decoration */}
                        <div className="absolute inset-0 -z-10 opacity-10" style={{
                            backgroundImage: 'radial-gradient(#FF2D55 0.5px, transparent 0.5px)',
                            backgroundSize: '12px 12px'
                        }} />

                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-3">
                                <div className="p-2 bg-pink-100 rounded-lg">
                                    <Wand2 className="w-5 h-5 md:w-6 md:h-6 text-[#FF2D55]" />
                                </div>
                                Magic Templates
                            </h3>
                            <button
                                onClick={() => setShowTemplates(false)}
                                className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"
                            >
                                <span className="text-2xl">✕</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-h-[60vh] md:max-h-none overflow-y-auto md:overflow-visible pr-2 md:pr-0 hide-scrollbar">
                            {TEMPLATES.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => handleTemplateSelect(t)}
                                    className="group relative flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 border-transparent hover:border-[#FF2D55]/30 hover:bg-white transition-all duration-200 bg-gray-50/50"
                                >
                                    <div className="text-4xl md:text-5xl filter drop-shadow-sm">
                                        {t.icon}
                                    </div>
                                    <span className="text-sm font-bold text-gray-700 tracking-tight">{t.name}</span>
                                </button>
                            ))}
                        </div>

                        <div className="mt-8 flex justify-center">
                            <p className="text-xs md:text-sm text-gray-400 font-medium">
                                Selection will clear your current canvas
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <m.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                onAnimationComplete={initCanvas}
                // Conditional styling: Modal vs Embedded
                className={readOnly
                    ? "w-full h-full relative overflow-hidden flex flex-col" // Embedded (Preview) - need flex for child to grow
                    : "fixed md:absolute left-0 md:left-8 right-0 md:right-8 top-0 md:top-4 bottom-0 md:bottom-8 z-70 bg-[#f8f8f8] md:rounded-lg shadow-2xl overflow-hidden flex flex-col border-0 md:border-2 border-dashed border-[#FF2D55] h-dvh md:h-auto" // Modal (Drawing)
                }
                style={{
                    willChange: 'transform, opacity',
                    backgroundImage: !readOnly ? 'radial-gradient(#e5e7eb 1px, transparent 1px)' : undefined,
                    backgroundSize: '20px 20px'
                }}
            >
                {/* Moves Counter - Top Left (hide in readOnly) */}
                {!readOnly && (
                    <div className="absolute top-4 left-6 z-10 text-sm font-bold font-mono text-gray-400 tracking-wider pointer-events-none">
                        {moves}/5 MOVES
                    </div>
                )}

                {/* Top Right Controls: Close & Template */}
                {!readOnly && (
                    <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setShowTemplates(true)}
                            aria-label="Choose a template"
                            className="w-10 h-10 bg-white text-[#FF2D55] border-2 border-[#FF2D55]/20 rounded-full flex items-center justify-center text-lg font-bold hover:scale-105 transition-all shadow-sm focus:outline-none"
                        >
                            <Wand2 className="w-5 h-5" />
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close drawing canvas"
                            className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center text-lg font-bold hover:scale-105 transition-all shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#FF2D55]"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Canvas Area with Overlay Controls */}
                <div
                    ref={containerRef}
                    className="grow w-full relative mt-0 min-h-0"
                >
                    {/* The Canvas itself */}
                    <canvas
                        ref={canvasRef}
                        role="img"
                        aria-label="Valentine drawing canvas - use mouse or touch to draw"
                        style={{ cursor: CURSOR_URL }}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="block w-full h-full touch-none relative z-0"
                    />

                    {/* UI Overlay - Only show when NOT in readOnly mode */}
                    {!readOnly && (
                        <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-end p-4 md:p-6 pb-6">
                            <div className="flex flex-col md:flex-row items-stretch md:items-end justify-between gap-3 md:gap-4 h-full md:h-auto pb-safe">
                                {/* Left Side: Text */}
                                <div className="flex flex-col gap-0.5 pointer-events-auto mt-auto md:mt-0">
                                    <h2 className="text-lg md:text-xl font-bold text-black mb-1">Draw something just for them,</h2>
                                    <div className="flex flex-col md:flex-row md:items-end gap-1 md:gap-6">
                                        <p className="text-xs md:text-sm text-gray-500 leading-relaxed font-medium">
                                            We&#39;ve started with a heart, now you draw something in 5 moves <br className="hidden md:block" /> which will turn into a
                                            beautiful card for your Valentine make your loved one feel special.
                                        </p>
                                    </div>
                                </div>

                                {/* Right Side: Buttons */}
                                <div className="flex flex-col items-center md:items-end gap-3 pointer-events-auto w-full md:w-auto mt-4 md:mt-0">
                                    <div className="flex flex-col-reverse md:flex-row items-center justify-center md:justify-end gap-3 md:gap-4 w-full md:w-auto">
                                        <button
                                            type="button"
                                            onClick={handleReset}
                                            aria-label="Reset canvas to initial state"
                                            className="text-sm font-medium text-gray-500 underline underline-offset-4 hover:text-black transition-colors whitespace-nowrap focus:outline-none focus-visible:text-black py-2"
                                        >
                                            Reset Canvas
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => onShare?.(strokes)}
                                            aria-label="Preview your card"
                                            disabled={moves === 0 && strokes.length === 0}
                                            className="w-full md:w-auto rounded-full px-8 py-3 md:px-6 md:py-2 border border-b-[3px] border-black cursor-pointer bg-[#FF2D55] hover:brightness-110 transition-all active:border-b text-white font-bold text-lg md:text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black disabled:opacity-50 disabled:cursor-not-allowed shadow-lg md:shadow-none"
                                        >
                                            Preview Card
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </m.div>
        </LazyMotion>
    );
}
