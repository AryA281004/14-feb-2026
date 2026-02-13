import { TEMPLATES } from './templates';

export const DEMO_CARDS = [
    {
        id: 'demo-1',
        sender: 'Romeo',
        receiver: 'Juliet',
        created_at: new Date().toISOString(),
        drawing: TEMPLATES.find(t => t.id === 'heart')?.strokes || []
    },
    {
        id: 'demo-2',
        sender: 'Adam',
        receiver: 'Eve',
        created_at: new Date().toISOString(),
        drawing: TEMPLATES.find(t => t.id === 'rose')?.strokes || []
    },
    {
        id: 'demo-3',
        sender: 'Cupid',
        receiver: 'Everyone',
        created_at: new Date().toISOString(),
        drawing: TEMPLATES.find(t => t.id === 'arrow')?.strokes || []
    },
    {
        id: 'demo-4',
        sender: 'Beauty',
        receiver: 'Beast',
        created_at: new Date().toISOString(),
        drawing: TEMPLATES.find(t => t.id === 'tulip')?.strokes || []
    },
    {
        id: 'demo-5',
        sender: 'Mr. Darcy',
        receiver: 'Elizabeth',
        created_at: new Date().toISOString(),
        drawing: TEMPLATES.find(t => t.id === 'envelope')?.strokes || []
    }
];
