
'use client';

import React, { useState } from 'react';
import Header from './Header';
import LeftSidebar from './LeftSidebar';
import ElementsPanel from './ElementsPanel';
import Canvas from './Canvas';
import Footer from './Footer';
import RightSidebar from './RightSidebar';
import { useCanvasStore } from '@/stores/canvas-store';

export default function DesignStudioPage() {
    const [activeTool, setActiveTool] = useState<string | null>('Fields');
    const { addElement, selectedElementId } = useCanvasStore();
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
    
    const panelTools = ['Fields', 'Shapes', 'Templates', 'Uploads', 'Images', 'Styles', 'More'];

    const handleToolClick = (tool: string) => {
        if (tool === 'Text') {
             addElement({
                type: 'text',
                x: 100,
                y: 100,
                width: 150,
                height: 30,
                rotation: 0,
                props: { text: 'Your text here', fontSize: 24, color: '#000000' }
            });
            // Don't open a panel for direct actions
            setActiveTool(null);
        } else if (panelTools.includes(tool)) {
            setActiveTool(prev => prev === tool ? null : tool);
        }
    };
    
    React.useEffect(() => {
        if(selectedElementId) {
            setIsRightSidebarOpen(true);
        }
    }, [selectedElementId]);

    return (
        <div className="flex flex-col h-screen w-screen bg-white text-gray-900">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                <LeftSidebar activeTool={activeTool} onToolClick={handleToolClick} />
                <div className="relative flex-1">
                    <Canvas onPageDoubleClick={() => setIsRightSidebarOpen(v => !v)} />
                    <ElementsPanel activeTool={activeTool} onClose={() => setActiveTool(null)} />
                    {isRightSidebarOpen && <RightSidebar onCollapse={() => setIsRightSidebarOpen(false)} />}
                </div>
            </div>
            <Footer />
        </div>
    );
}
