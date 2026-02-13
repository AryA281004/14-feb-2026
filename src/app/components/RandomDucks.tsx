import Image from "next/image";

const DECORATIONS = [
    // Bottom Left
    { src: "/duck1.webp", alt: "will you be my valentine", bottom: "2%", left: "2%", scale: 1.4, rotate: "0deg", },
    // Bottom Right
    { src: "/duck2.webp", alt: "will you be my valentine cute gift", bottom: "2%", right: "0%", scale: 1.25, rotate: "0deg" },
    // Top Left
    // Start after 1s
    { src: "/duck5.webp", alt: "will you be my valentine game", top: "15%", left: "5%", scale: 0.9, rotate: "-7deg", hiddenOnMobile: true, waddle: true, delay: "1s" },
    // Top Right
    { src: "/duck4.webp", alt: "will you be my valentine 14 feb", top: "15%", right: "5%", scale: 1.1, rotate: "7deg", hiddenOnMobile: true, waddle: true, delay: "0s" },

    { src: "/duck3.webp", alt: "will you be my valentine card", bottom: "35%", left: "5%", scale: 1.0, rotate: "12deg" },
    // Start after 2s
    { src: "/duck7.webp", alt: "will you be my valentine online", bottom: "34%", right: "4%", scale: 0.85, waddle: true, delay: "2s" },
    // Start after 0.5s
    { src: "/duck6.webp", alt: "will you be my valentine proposal", bottom: "6%", left: "45%", scale: 1.15, rotate: "12deg", hiddenOnMobile: true, waddle: true, delay: "0.5s" },
    { src: "/duck8.webp", alt: "will you be my valentine free", bottom: "1%", right: "22%", scale: 0.85, hiddenOnMobile: true },
    // Start after 1.5s
    { src: "/duck9.webp", alt: "will you be my valentine duck", bottom: "1%", left: "25%", scale: 1.0, hiddenOnMobile: true, waddle: true, delay: "1.5s" },

    // Tiny Icons
    { src: "/comment.svg", alt: "will you be my valentine", bottom: "18%", left: "15%", scale: 0.5, },
    { src: "/comment.svg", alt: "will you be my valentine", top: "25%", right: "15%", scale: 0.5, hiddenOnMobile: true },
    { src: "/ily.webp", alt: "will you be my valentine i love you", top: "28%", left: "12%", scale: 0.2, rotate: "20deg" },
    { src: "/ily.webp", alt: "will you be my valentine wish", bottom: "15%", right: "20%", scale: 0.2 },
    { src: "/ily.webp", alt: "will you be my valentine", bottom: "0%", right: "40%", scale: 0.15 },
];

interface RandomDucksProps {
    variant?: 'default' | 'hidden' | 'spinning';
}

export default function RandomDucks({ variant = 'default' }: RandomDucksProps) {
    if (variant === 'hidden') return null;

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes smooth-spin {
                    from { rotate: 0deg; }
                    to { rotate: 360deg; }
                }
                .animate-smooth-spin {
                    animation: smooth-spin 3s linear infinite;
                }
            `}} />
            {DECORATIONS.map((item, index) => (
                <div
                    key={index}
                    className={`absolute select-none pointer-events-none transition-all duration-500 ease-in-out ${item.hiddenOnMobile ? 'hidden md:block' : 'block'}`}
                    style={{
                        top: item.top,
                        left: item.left,
                        bottom: item.bottom,
                        right: item.right,
                        rotate: item.rotate || '0deg',
                        transform: `scale(${item.scale})`,
                        ...((item.delay && variant !== 'spinning') ? { animationDelay: item.delay } : {}),
                    }}
                >
                    <div className={variant === 'spinning' ? 'animate-smooth-spin' : ''}>
                        <Image
                            src={item.src}
                            alt={item.alt}
                            width={100}
                            height={100}
                            draggable={false}
                            className={`opacity-90 hover:opacity-100 ${item.waddle && variant !== 'spinning' ? 'animate-waddle' : ''}`}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}