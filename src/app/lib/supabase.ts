import { createClient } from '@supabase/supabase-js';
import { Stroke } from '../utils/encode';

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if Supabase is configured
const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Create client only if configured (prevents build errors)
export const supabase = isSupabaseConfigured
    ? createClient(supabaseUrl!, supabaseAnonKey!)
    : null;

// Types
export interface GalleryCard {
    id: string;
    sender: string;
    receiver: string;
    drawing: Stroke[];
    created_at: string;
}

// Check if gallery feature is available
export const isGalleryEnabled = (): boolean => isSupabaseConfigured;

// Save a card to the gallery
export const saveCardToGallery = async (
    sender: string,
    receiver: string,
    drawing: Stroke[]
): Promise<{ success: boolean; error?: string }> => {
    // Skip if not configured
    if (!supabase) {
        console.warn('Supabase not configured. Skipping gallery save.');
        return { success: false, error: 'Gallery not configured' };
    }

    try {
        const { error } = await supabase
            .from('cards')
            .insert([{ sender, receiver, drawing }]);

        if (error) {
            const errorMessage = error.message || JSON.stringify(error) || 'Unknown error';
            console.error('Failed to save card:', errorMessage);
            return { success: false, error: errorMessage };
        }

        return { success: true };
    } catch (e) {
        console.error('Unexpected error saving card:', e);
        return { success: false, error: 'Unexpected error' };
    }
};

// Fetch all cards for the gallery
export const fetchGalleryCards = async (): Promise<GalleryCard[]> => {
    // Skip if not configured
    if (!supabase) {
        console.warn('Supabase not configured. Returning empty gallery.');
        return [];
    }

    try {
        const { data, error } = await supabase
            .from('cards')
            .select('id, sender, receiver, drawing, created_at')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            const errorMessage = error.message || JSON.stringify(error) || 'Unknown error';
            console.error('Failed to fetch cards:', errorMessage);
            return [];
        }

        return (data as GalleryCard[]) || [];
    } catch (e) {
        console.error('Unexpected error fetching cards:', e);
        return [];
    }
};

// Log every card creation (for analytics, tracks all links generated)
export const logCardCreation = async (
    sender: string,
    receiver: string
): Promise<{ success: boolean; error?: string }> => {
    // Skip if not configured
    if (!supabase) {
        console.warn('Supabase not configured. Skipping card log.');
        return { success: false, error: 'Supabase not configured' };
    }

    try {
        const { error } = await supabase
            .from('card_logs')
            .insert([{ sender, receiver }]);

        if (error) {
            const errorMessage = error.message || JSON.stringify(error) || 'Unknown error';
            console.error('Failed to log card creation:', errorMessage);
            return { success: false, error: errorMessage };
        }

        return { success: true };
    } catch (e) {
        console.error('Unexpected error logging card:', e);
        return { success: false, error: 'Unexpected error' };
    }
};

// Short link: Save full card data and return a short ID
export const saveSharedCard = async (
    sender: string,
    receiver: string,
    drawing: Stroke[],
    quoteIndex: number
): Promise<{ success: boolean; id?: string; error?: string }> => {
    if (!supabase) {
        console.warn('Supabase not configured. Cannot create short link.');
        return { success: false, error: 'Supabase not configured' };
    }

    try {
        const { data, error } = await supabase
            .from('shared_cards')
            .insert([{ sender, receiver, drawing, quote_index: quoteIndex }])
            .select('id')
            .single();

        if (error) {
            const errorMessage = error.message || JSON.stringify(error) || 'Unknown error';
            console.error('Failed to save shared card:', errorMessage);
            return { success: false, error: errorMessage };
        }

        return { success: true, id: data.id };
    } catch (e) {
        console.error('Unexpected error saving shared card:', e);
        return { success: false, error: 'Unexpected error' };
    }
};

// Short link: Fetch card data by ID
export interface SharedCardData {
    sender: string;
    receiver: string;
    drawing: Stroke[];
    quote_index: number;
}

export const fetchSharedCard = async (id: string): Promise<SharedCardData | null> => {
    if (!supabase) {
        console.warn('Supabase not configured. Cannot fetch shared card.');
        return null;
    }

    try {
        const { data, error } = await supabase
            .from('shared_cards')
            .select('sender, receiver, drawing, quote_index')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Failed to fetch shared card:', error);
            return null;
        }

        return data as SharedCardData;
    } catch (e) {
        console.error('Unexpected error fetching shared card:', e);
        return null;
    }
};
