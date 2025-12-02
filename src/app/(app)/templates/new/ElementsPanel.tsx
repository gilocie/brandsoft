
'use client';

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCanvasStore } from '@/stores/canvas-store';
import { Rectangle, Circle, Triangle, Star } from 'lucide-react';

const ShapeItem = ({ icon: Icon, addShape }: { icon: React.ElementType, addShape: () => void }) => (
    <div 
        className="h-24 bg-gray-200 rounded-md flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors"
        onClick={addShape}
    >
        <Icon className="h-10 w-10 text-gray-600" />
    </div>
);

const ShapesPanel = () => {
    const { addElement } = useCanvasStore();

    const addRectangle = () => {
        addElement({
            type: 'shape',
            x: 100, y: 100, width: 150, height: 100, rotation: 0,
            props: { backgroundColor: '#cccccc' }
        });
    }
    
    const addCircle = () => {
         addElement({
            type: 'shape',
            x: 150, y: 150, width: 100, height: 100, rotation: 0,
            props: { backgroundColor: '#cccccc', borderRadius: '50%' }
        });
    }
    
    const addTriangle = () => {
        addElement({
            type: 'shape',
            x: 150, y: 150, width: 100, height: 100, rotation: 0,
            props: { 
                backgroundColor: '#cccccc',
                clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
            }
        });
    };

    const addStar = () => {
        addElement({
            type: 'shape',
            x: 150, y: 150, width: 100, height: 100, rotation: 0,
            props: {
                backgroundColor: '#cccccc',
                clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
            }
        });
    };

    return (
        <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Shapes</h3>
            <div className="grid grid-cols-2 gap-4">
                <ShapeItem icon={Rectangle} addShape={addRectangle} />
                <ShapeItem icon={Circle} addShape={addCircle} />
                <ShapeItem icon={Triangle} addShape={addTriangle} />
                <ShapeItem icon={Star} addShape={addStar} />
            </div>
        </div>
    );
}

const PanelContent = ({ activeTool }: { activeTool: string | null }) => {
    switch(activeTool) {
        case 'Shapes':
            return <ShapesPanel />;
        // Add cases for other tools here
        default:
            return (
                <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-4">{activeTool}</h3>
                     <div className="flex h-40 items-center justify-center text-center text-sm text-gray-400">
                        <p>No items available for this tool yet.</p>
                    </div>
                </div>
            );
    }
}


const ElementsPanel = ({ activeTool }: { activeTool: string | null }) => {
    if (!activeTool) return null;

    return (
        <div className="w-56 bg-gray-100 border-l border-r border-gray-200 z-10">
            <ScrollArea className="h-full">
                <PanelContent activeTool={activeTool} />
            </ScrollArea>
        </div>
    );
};

export default ElementsPanel;
