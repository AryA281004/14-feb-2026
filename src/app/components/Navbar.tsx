import Image from "next/image";

interface NavbarProps {
    onDrawClick: () => void;
    onGalleryClick: () => void;
    isDrawOpen: boolean;
}

export default function Navbar({ onDrawClick, onGalleryClick, isDrawOpen }: NavbarProps) {
    return (
        <nav className="flex items-center justify-between p-4 px-8 relative z-[60]" role="navigation" aria-label="Main navigation">
            <div className="flex items-center gap-4">
                <Image src={'/heart-fill.gif'} alt="will you be my valentine" width={45} height={45} />
            </div>
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={onDrawClick}
                    aria-label={isDrawOpen ? "Close drawing canvas" : "Open drawing canvas"}
                    aria-pressed={isDrawOpen}
                    className="rounded-full px-6 py-1 border border-b-[3px] border-black cursor-pointer bg-[#FF2D55] hover:brightness-110 transition-all active:border-b text-white font-medium w-[90px] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black"
                >
                    Draw
                </button>
                <button
                    type="button"
                    onClick={onGalleryClick}
                    aria-label="View community gallery"
                    className="rounded-full px-6 py-1 border border-b-[3px] border-black cursor-pointer bg-[#FF2D55] hover:brightness-110 transition-all active:border-b text-white font-medium w-[90px] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black"
                >
                    Gallery
                </button>
            </div>
        </nav>
    );
}