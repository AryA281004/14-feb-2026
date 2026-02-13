'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import CreatorFlow from './CreatorFlow';
import ReceiverView from './ReceiverView';
import { decodeData, ShareData } from '../utils/encode';
import { fetchSharedCard } from '../lib/supabase';

export default function HomeClient() {
    const searchParams = useSearchParams();
    const dataParam = searchParams.get('data');
    const idParam = searchParams.get('id');
    const [receiverData, setReceiverData] = useState<ShareData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            // Priority 1: Short link via Supabase ID
            if (idParam) {
                const card = await fetchSharedCard(idParam);
                if (card) {
                    setReceiverData({
                        s: card.sender,
                        r: card.receiver,
                        d: card.drawing,
                        q: card.quote_index
                    });
                }
            }
            // Priority 2: Legacy encoded data param
            else if (dataParam) {
                const decoded = decodeData(dataParam);
                if (decoded) {
                    setReceiverData(decoded);
                }
            }
            setLoading(false);
        };

        loadData();
    }, [dataParam, idParam]);

    if (loading) return null;

    // Receiver View (when opening a shared link)
    if (receiverData) {
        return <ReceiverView data={receiverData} />;
    }

    // Creator Flow (Gallery is now accessed via Navbar button)
    return <CreatorFlow />;
}
