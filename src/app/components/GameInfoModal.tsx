'use client';

interface GameInfoModalProps {
    onClose: () => void;
}

export default function GameInfoModal({ onClose }: GameInfoModalProps) {
    return (
        <div className="fixed inset-0 z-100 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-[#f8f8f8] p-8 rounded-xl max-w-md w-full relative border-2 border-dashed border-[#FF2D55] shadow-2xl animate-in fade-in zoom-in duration-300"
                onClick={(e) => e.stopPropagation()}
                style={{
                    backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                }}
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors"
                >
                    ✕
                </button>

                <h2 className="text-2xl font-bold text-[#FF2D55] mb-6 text-center uppercase tracking-widest">How to Play</h2>

                <div className="space-y-4 text-gray-700 font-medium">
                    <div className="flex gap-3 items-start">
                        <span className="bg-[#FF2D55] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm shrink-0 mt-0.5">1</span>
                        <p>Enter your Valentine&apos;s name.</p>
                    </div>
                    <div className="flex gap-3 items-start">
                        <span className="bg-[#FF2D55] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm shrink-0 mt-0.5">2</span>
                        <p>Draw something special for them using only <strong>5 strokes</strong>.</p>
                    </div>
                    <div className="flex gap-3 items-start">
                        <span className="bg-[#FF2D55] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm shrink-0 mt-0.5">3</span>
                        <p>Share the magic link with your special one.</p>
                    </div>
                    <div className="flex gap-3 items-start">
                        <span className="bg-[#FF2D55] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm shrink-0 mt-0.5">4</span>
                        <p>They will answer some question, and view surprise drawing card, and respond!</p>
                    </div>
                    <div className="flex gap-3 items-start">
                        <span className="bg-[#FF2D55] text-white rounded-full w-6 h-6 flex items-center justify-center text-sm shrink-0 mt-0.5">4</span>
                        <p>Cross your fingers and wait 🤞</p>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-[#FF2D55] text-sm underline underline-offset-4 transition-colors"
                    >
                        Got it, let&apos;s play!
                    </button>
                </div>
            </div>
        </div>
    );
}
