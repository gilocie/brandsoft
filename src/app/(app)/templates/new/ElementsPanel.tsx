
'use client';

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCanvasStore } from '@/stores/canvas-store';

const ShapeItem = ({ label, addShape }: { label: string, addShape: () => void }) => (
    <div 
        className="h-24 bg-gray-200 rounded-md flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors"
        onClick={addShape}
    >
        <div className="text-sm text-gray-600">{label}</div>
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

    return (
        <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Shapes</h3>
            <div className="grid grid-cols-2 gap-4">
                <ShapeItem label="Rectangle" addShape={addRectangle} />
                <ShapeItem label="Circle" addShape={addCircle} />
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
        <div className="w-80 bg-gray-100 border-l border-r border-gray-200 z-10">
            <ScrollArea className="h-full">
                <PanelContent activeTool={activeTool} />
            </ScrollArea>
        </div>
    );
};

export default ElementsPanel;
