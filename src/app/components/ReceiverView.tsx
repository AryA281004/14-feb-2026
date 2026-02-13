'use client';

import { useState, useEffect, useCallback, memo, useRef } from 'react';
import Image from 'next/image';
import { ShareData, ROMANTIC_QUOTES, Stroke } from '../utils/encode';
import RandomDucks from './RandomDucks';
import confetti from 'canvas-confetti';
import Gallery from './Gallery';
// DrawingPreview component for rendering strokes
const DrawingPreview = memo(function DrawingPreview({ strokes }: { strokes: Stroke[] }) {    const canvasRef = useRef<HTMLCanvasElement>(null);
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

// Questions array defined outside component to prevent recreation on every render
const QUESTIONS_TEMPLATE = [
    {
        text: (name: string) => `${name || 'Love'}, do you enjoy talking to me?`,
        options: ["Yes", "A little"]
    },
    {
        text: () => "Do my messages make you smile sometimes?",
        options: ["Yes", "Sometimes"]
    },
    {
        text: () => "Do you feel like I understand you a little?",
        options: ["Yes", "I think so"]
    },
    {
        text: () => "Would you be okay if I kept trying to make you smile?",
        options: ["Please do ❤️", "Let's just be friends"]
    }
];

interface ReceiverViewProps {
    data: ShareData;
}

export default function ReceiverView({ data }: ReceiverViewProps) {
    const [step, setStep] = useState<'INTRO' | 'CHECKLIST' | 'REVEAL' | 'PROPOSAL'>('INTRO');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [proposalStatus, setProposalStatus] = useState<'idle' | 'yes' | 'no'>('idle');
    const [showCardModal, setShowCardModal] = useState(false);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);

    // Generate questions from template with receiver name
    const questions = QUESTIONS_TEMPLATE.map(q => ({
        text: q.text(data.r || ''),
        options: q.options
    }));

    const handleNextQuestion = useCallback(() => {
        if (currentQuestionIndex < QUESTIONS_TEMPLATE.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            setStep('REVEAL');
        }
    }, [currentQuestionIndex]);

    // Auto-advance from Reveal to Proposal after animation
    useEffect(() => {
        if (step === 'REVEAL') {
            const timer = setTimeout(() => {
                setStep('PROPOSAL');
            }, 5000 + (data.d.length * 500)); // Dynamic wait based on drawing complexity
            return () => clearTimeout(timer);
        }
    }, [step, data.d.length]);


    const handleYesClick = useCallback(() => {
        setProposalStatus('yes');
        confetti({
            particleCount: 200,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FF2D55', '#FFC0CB', '#FFFFFF']
        });
    }, []);

    const handleNoClick = useCallback(() => {
        setProposalStatus('no');
    }, []);

    return (
        <>
            <RandomDucks variant={proposalStatus === 'no' ? 'hidden' : proposalStatus === 'yes' ? 'spinning' : 'default'} />

            {/* Navbar for Receiver */}
            <nav className="fixed top-0 left-0 w-full flex items-center justify-between p-4 px-8 z-60">
                {/* Left Side: Heart + Try it */}
                <div className="flex items-center gap-4">
                    <Image src={'/heart-fill.gif'} alt="will you be my valentine" width={45} height={45} />
                    <button
                        onClick={() => window.location.href = '/'}
                        className="rounded-full px-5 md:px-6 py-1 border border-b-[3px] border-black cursor-pointer bg-[#FF2D55] hover:brightness-110 transition-all active:border-b text-white font-medium text-xs md:text-sm whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black"
                    >
                        Try it
                    </button>
                </div>

                {/* Right Side: Gallery + Special Card */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsGalleryOpen(true)}
                        className="rounded-full px-5 md:px-6 py-1 border border-b-[3px] border-black cursor-pointer bg-[#FF2D55] hover:brightness-110 transition-all active:border-b text-white font-medium text-xs md:text-sm whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black"
                    >
                        Gallery
                    </button>
                    {step === 'PROPOSAL' && (
                        <button
                            onClick={() => setShowCardModal(true)}
                            className="rounded-full px-5 md:px-6 py-1 border border-b-[3px] border-black cursor-pointer bg-[#FF2D55] hover:brightness-110 transition-all active:border-b text-white font-medium text-xs md:text-sm whitespace-nowrap min-w-[120px] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black"
                        >
                            Special Card
                        </button>
                    )}
                </div>
            </nav>

            {showCardModal && (
                <div className="fixed inset-0 z-100 bg-black/60 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setShowCardModal(false)}>
                    <div className="relative w-full max-w-md bg-pink-50 rounded-3xl p-8 shadow-2xl animate-in zoom-in duration-300 overflow-hidden" onClick={e => e.stopPropagation()}>
                        {/* Decorations */}
                        <Image src="/bow.webp" alt="will you be my valentine" width={64} height={64} className="absolute top-0 left-0 z-20 -rotate-20" />
                        <Image src="/avocado.svg" alt="will you be my valentine sticker" width={56} height={56} className="absolute bottom-0 left-2 z-20" />
                        <Image src="/msg.webp" alt="will you be my valentine message" width={48} height={48} className="absolute top-12 -right-2 z-20 rotate-12" />
                        <Image src="/heart.webp" alt="will you be my valentine heart" width={32} height={32} className="absolute top-30 right-4 z-20 -rotate-10" />
                        <Image src="/ily.webp" alt="will you be my valentine i love you" width={32} height={32} className="absolute bottom-32 left-6 z-20 rotate-10" />
                        <Image src="/love.svg" alt="will you be my valentine" width={128} height={128} className="absolute -bottom-6 -right-6 opacity-30" />

                        {/* Close Button - Heart Style */}
                        <button
                            onClick={() => setShowCardModal(false)}
                            className="absolute top-1 right-1 z-30 w-10 h-10 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 text-black text-xl"
                        >
                            ✕
                        </button>

                        {/* Card Content */}
                        <div className="text-center relative z-10 pt-4">
                            <div className="flex flex-col items-center gap-1 mb-4">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-[#FF2D55] font-bold">To my favorite</span>
                                <h3 className="text-3xl text-gray-800" style={{ fontFamily: '"Chewy", cursive', transform: 'rotate(-2deg)' }}>
                                    {data.r || 'You'}
                                </h3>
                            </div>

                            <div className="h-64 bg-white rounded-2xl overflow-hidden border-2 border-dashed border-gray-100 flex items-center justify-center mb-6 relative">
                                <div className="absolute inset-0 opacity-30" style={{
                                    backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)',
                                    backgroundSize: '20px 20px'
                                }}></div>
                                <DrawingPreview strokes={data.d} />
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="flex flex-wrap justify-center items-baseline gap-x-3 gap-y-1">
                                    <span className="text-gray-500 text-sm">from</span>
                                    <span className="text-2xl text-gray-600" style={{ fontFamily: '"Chewy", cursive' }}>{data.s}</span>
                                </div>
                                <p className="text-[#FF2D55] text-xs font-medium italic mt-3 max-w-[280px] mx-auto leading-relaxed">
                                    &quot;{ROMANTIC_QUOTES[data.q || 0]}&quot;
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {step === 'INTRO' && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500 overflow-y-auto">
                    <h1
                        className="text-5xl md:text-7xl text-[#FF2D55] mb-6 leading-tighter max-w-4xl mx-auto tracking-wide uppercase mt-20 md:mt-0 animate-in fade-in slide-in-from-bottom-5 duration-700"
                        style={{
                            fontFamily: '"Chewy", cursive',
                            textShadow: '3px 3px 0px #000000',
                            WebkitTextStroke: '1.5px black'
                        }}
                    >
                        A Heart <br /> Just For You !
                    </h1>
                    <div className=" animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">

                        <p className="text-gray-800 text-sm md:text-base font-medium -mt-1">
                            (made this especially for you)
                        </p>
                    </div>

                    <div className="w-full max-w-sm bg-white/40 backdrop-blur-md p-6 md:p-8 rounded-3xl border-2 border-white/50 shadow-xl animate-in fade-in zoom-in duration-700 delay-200 mt-4 relative overflow-hidden">
                        {/* Decorations */}
                        <Image src="/bow.webp" alt="will you be my valentine" width={48} height={48} className="absolute top-1 left-1 z-20 -rotate-12 drop-shadow-md" />
                        <Image src="/bow.webp" alt="will you be my valentine" width={48} height={48} className="absolute top-1 right-1 z-20 rotate-12 drop-shadow-md" />

                        <Image src="/love.svg" alt="will you be my valentine" width={100} height={100} className="absolute -bottom-4 -right-4 opacity-40 pointer-events-none" />
                        <Image src="/love.svg" alt="will you be my valentine" width={100} height={100} className="absolute -bottom-4 -left-4 opacity-40 pointer-events-none" />

                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 p-3 border-2 border-white/50 shadow-inner">
                            <Image src="/heart.webp" alt="will you be my valentine card" width={64} height={64} className="w-full h-full object-contain" />
                        </div>

                        <div className="space-y-3 mb-2">
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-[#FF2D55] font-bold opacity-80">To my favorite</span>
                                <h2 className="text-3xl text-gray-900 leading-tight" style={{ fontFamily: 'var(--font-chewy)', transform: 'rotate(-1deg)' }}>
                                    {data.r || 'You'} !
                                </h2>
                            </div>

                            <div className="bg-white/60 p-4 rounded-xl border border-white/50 shadow-sm backdrop-blur-sm">
                                <p className="text-gray-600 text-sm font-medium leading-relaxed">
                                    I have built a tiny universe just to ask you something…
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => setStep('CHECKLIST')}
                            className="w-full bg-[#FF2D55] text-white px-8 py-3.5 rounded-full font-bold text-lg hover:scale-[1.02] transition-all shadow-lg shadow-pink-200 relative z-10 active:scale-95 border-b-4 border-black/20"
                        >
                            Open 🙈
                        </button>
                    </div>
                </div>
            )}

            {step === 'CHECKLIST' && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 text-center overflow-y-auto bg-black/10 backdrop-blur-sm">
                    <div
                        className="max-w-md w-full bg-white/60 backdrop-blur-md p-8 rounded-3xl border-2 border-white/50 shadow-xl animate-in zoom-in fade-in duration-300 relative overflow-hidden"
                    >
                        {/* Progress Bar */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
                            <div
                                className="h-full bg-[#FF2D55] transition-all duration-500 ease-out"
                                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                            />
                        </div>

                        <div className="mb-8">
                            <span className="text-[10px] uppercase tracking-[0.2em] text-[#FF2D55] font-bold mb-4 block">Question {currentQuestionIndex + 1} of {questions.length}</span>
                            <h2 className="text-3xl text-gray-900 leading-tight" style={{ fontFamily: 'var(--font-chewy)' }}>
                                {questions[currentQuestionIndex].text}
                            </h2>
                        </div>

                        <div className="flex flex-col gap-3 relative z-10">
                            {questions[currentQuestionIndex].options.map((option, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        if (idx === 0) {
                                            handleNextQuestion();
                                        } else {
                                            const btn = document.getElementById(`opt-btn-${idx}`);
                                            if (btn) {
                                                btn.style.transform = `translateX(${Math.random() * 20 - 10}px) translateY(${Math.random() * 20 - 10}px)`;
                                            }
                                            handleNextQuestion();
                                        }
                                    }}
                                    id={`opt-btn-${idx}`}
                                    className={idx === 0
                                        ? "w-full bg-[#FF2D55] text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:brightness-110 active:scale-95 transition-all"
                                        : "w-full bg-white text-gray-600 py-3 rounded-2xl font-bold text-sm border-2 border-gray-50 hover:bg-gray-50 transition-all"
                                    }
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {step === 'REVEAL' && (
                <div className="fixed inset-0 z-50 bg-black/10 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="relative w-full max-w-md bg-pink-50 rounded-3xl p-8 shadow-2xl animate-in zoom-in duration-500 overflow-hidden">
                        {/* Decorations */}
                        <Image src="/bow.webp" alt="will you be my valentine" width={64} height={64} className="absolute top-0 left-0 z-20 -rotate-20" />
                        <Image src="/avocado.svg" alt="will you be my valentine sticker" width={56} height={56} className="absolute bottom-0 left-2 z-20" />
                        <Image src="/msg.webp" alt="will you be my valentine message" width={48} height={48} className="absolute top-12 -right-2 z-20 rotate-12" />
                        <Image src="/heart.webp" alt="will you be my valentine heart" width={32} height={32} className="absolute top-30 right-4 z-20 -rotate-10" />
                        <Image src="/ily.webp" alt="will you be my valentine i love you" width={32} height={32} className="absolute bottom-32 left-6 z-20 rotate-10" />
                        <Image src="/love.svg" alt="will you be my valentine" width={128} height={128} className="absolute -bottom-6 -right-6 opacity-30" />

                        {/* Card Content */}
                        <div className="text-center relative z-10 pt-4">
                            <div className="flex flex-col items-center gap-1 mb-4">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-[#FF2D55] font-bold">To my favorite</span>
                                <h3 className="text-3xl text-gray-800" style={{ fontFamily: '"Chewy", cursive', transform: 'rotate(-2deg)' }}>
                                    {data.r || 'You'}
                                </h3>
                            </div>

                            <div className="relative border-2 border-dashed border-gray-100 rounded-2xl overflow-hidden h-64 md:h-80 bg-white flex items-center justify-center z-10">
                                <div className="absolute inset-0 opacity-30" style={{
                                    backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)',
                                    backgroundSize: '20px 20px'
                                }}></div>
                                <DrawingPreview strokes={data.d} />
                            </div>

                            <div className="mt-4 text-center relative z-10">
                                <div className="flex flex-wrap justify-center items-baseline gap-x-3 gap-y-1">
                                    <span className="text-gray-500 text-sm">from</span>
                                    <span className="text-2xl text-gray-600" style={{ fontFamily: '"Chewy", cursive' }}>{data.s}</span>
                                </div>
                                <p className="text-[#FF2D55] text-xs font-medium italic mt-3 max-w-[280px] mx-auto leading-relaxed">
                                    &quot;{ROMANTIC_QUOTES[data.q || 0]}&quot;
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {step === 'PROPOSAL' && (
                proposalStatus === 'no' ? (
                    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-1000">
                        <div className="max-w-md w-full animate-in zoom-in duration-500">
                            <div className="text-6xl mb-6 drop-shadow-xl">💔</div>
                            <button
                                onClick={() => setProposalStatus('idle')}
                                className="text-gray-700 underline text-lg transition-colors font-medium tracking-wide"
                            >
                                Wait... I didn&apos;t mean it!
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 text-center">
                        <div className="flex flex-col items-center justify-center relative z-10 px-4 text-center max-w-4xl mx-auto w-full">

                            {/* Matching Hero Heading */}
                            <h1
                                className="text-5xl md:text-7xl text-[#FF2D55] mb-6 leading-tighter tracking-wide uppercase mt-20 md:mt-0 animate-in fade-in slide-in-from-bottom-5 duration-700"
                                style={{
                                    fontFamily: '"Chewy", cursive',
                                    textShadow: '4px 4px 0px #000000',
                                    WebkitTextStroke: '2px black'
                                }}
                            >
                                Will you be my <br /> Valentine ?
                            </h1>

                            {/* Yes/No Buttons */}
                            <div className="flex flex-wrap items-center justify-center gap-8 animate-in fade-in zoom-in duration-700 delay-200 mt-12">
                                <button
                                    onClick={handleYesClick}
                                    className="rounded-3xl px-12 py-4 border-2 border-black border-b-[6px] cursor-pointer bg-[#2ecc71] hover:brightness-110 hover:-translate-y-1 transition-all active:border-b-2 active:translate-y-1 text-white font-black text-3xl min-w-[180px] focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-[#2ecc71] rotate-2"
                                >
                                    YES!
                                </button>
                                <button
                                    onClick={handleNoClick}
                                    className="rounded-3xl px-12 py-4 border-2 border-black border-b-[6px] cursor-pointer bg-[#FF2D55] hover:brightness-110 hover:-translate-y-1 transition-all active:border-b-2 active:translate-y-1 text-white font-black text-3xl min-w-[180px] focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-[#FF2D55] -rotate-2"
                                >
                                    No
                                </button>
                            </div>

                        </div>
                    </div>
                )
            )}

            <Gallery isOpen={isGalleryOpen} onClose={() => setIsGalleryOpen(false)} />
        </>
    );
}
