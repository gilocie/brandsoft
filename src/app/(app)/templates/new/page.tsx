
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
    const [activeTool, setActiveTool] = useState<string | null>(null);
    const { addElement, selectedElementId } = useCanvasStore();
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

    const [elementsPanelPosition, setElementsPanelPosition] = useState({ x: 112, y: 16 });
    const [rightSidebarPosition, setRightSidebarPosition] = useState({ x: 16, y: 16 });
    
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
            }, {select: true });
            // Don't open a panel for direct actions
            setActiveTool(null);
            setIsRightSidebarOpen(true);
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
                    <ElementsPanel 
                        activeTool={activeTool} 
                        onClose={() => setActiveTool(null)} 
                        position={elementsPanelPosition}
                        setPosition={setElementsPanelPosition}
                    />
                    {isRightSidebarOpen && (
                        <RightSidebar 
                            onCollapse={() => setIsRightSidebarOpen(false)} 
                            position={rightSidebarPosition}
                            setPosition={setRightSidebarPosition}
                        />
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
}
