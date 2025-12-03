

'use client';

import React, { useState, useEffect } from 'react';
import Header from './Header';
import LeftSidebar from './LeftSidebar';
import ElementsPanel from './ElementsPanel';
import Canvas from './Canvas';
import Footer from './Footer';
import RightSidebar from './RightSidebar';
import { useCanvasStore } from '@/stores/canvas-store';
import SaveTemplateDialog from './SaveTemplateDialog';
import NewPageDialog from './NewPageDialog'; // Import the new dialog

export default function DesignStudioPage() {
    const { 
        addElement, 
        selectedElementId, 
        isNewPageDialogOpen, 
        setNewPageDialogOpen,
        activePanel,
        setActivePanel 
    } = useCanvasStore();
    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

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
            setActivePanel(null);
        } else if (panelTools.includes(tool)) {
            setActivePanel(tool);
        }
    };
    
    useEffect(() => {
        if(selectedElementId) {
            setIsRightSidebarOpen(true);
        }
    }, [selectedElementId]);

    return (
        <>
            <div className="flex flex-col h-screen w-screen bg-white text-gray-900 overflow-hidden">
                <Header onSaveTemplate={() => setIsSaveDialogOpen(true)} />
                <div className="flex flex-1 overflow-hidden">
                    <LeftSidebar activeTool={activePanel} onToolClick={handleToolClick} />
                    <div className="relative flex-1 flex flex-col">
                        <Canvas onPageDoubleClick={() => setIsRightSidebarOpen(v => !v)} />
                        <ElementsPanel 
                            activeTool={activePanel} 
                            onClose={() => setActivePanel(null)} 
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
            <SaveTemplateDialog 
                isOpen={isSaveDialogOpen}
                onClose={() => setIsSaveDialogOpen(false)}
            />
            <NewPageDialog
                isOpen={isNewPageDialogOpen}
                onClose={() => setNewPageDialogOpen(false)}
            />
        </>
    );
}
