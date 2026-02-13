import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Will You Be My Valentine?',
        short_name: 'Valentine',
        description: 'The most unique way to ask the big question. 💌',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#FF2D55',
        icons: [
            {
                src: '/favicon.ico',
                sizes: 'any',
                type: 'image/x-icon',
            },
            {
                src: '/willyoubemyvalentine.webp',
                sizes: '512x512',
                type: 'image/webp',
            },
        ],
    };
}
