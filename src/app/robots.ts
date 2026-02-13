import { MetadataRoute } from 'next';

export const dynamic = 'force-static';
export const revalidate = false;

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/private/', '/api/'],
        },
        sitemap: 'https://willyoubmyvalentine.vercel.app/sitemap.xml',
    };
}
