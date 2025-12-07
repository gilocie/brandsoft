

'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from './Header';
import LeftSidebar from './LeftSidebar';
import ElementsPanel from './ElementsPanel';
import Canvas from './Canvas';
import Footer from './Footer';
import RightSidebar from './RightSidebar';
import { useCanvasStore } from '@/stores/canvas-store';
import SaveTemplateDialog from './SaveTemplateDialog';
import NewPageDialog from './NewPageDialog';
import { useBrandsoft } from '@/hooks/use-brandsoft';

export default function DesignStudioPage() {
    const { 
        addElement, 
        selectedElementId, 
        isNewPageDialogOpen, 
        setNewPageDialogOpen,
        activePanel,
        setActivePanel,
        setLiveDataContext,
        setPages,
    } = useCanvasStore();
    const { config } = useBrandsoft();

    const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
    const searchParams = useSearchParams();

    const [elementsPanelPosition, setElementsPanelPosition] = useState({ x: 112, y: 16 });
    const [rightSidebarPosition, setRightSidebarPosition] = useState({ x: 16, y: 16 });
    
    const panelTools = ['Fields', 'Shapes', 'Templates', 'Uploads', 'Images', 'Styles', 'More'];

    useEffect(() => {
        const documentType = searchParams.get('documentType');
        const documentId = searchParams.get('documentId');

        if (documentType && documentId && config) {
            let document;
            let customer;

            if (documentType === 'invoice') {
                document = config.invoices.find(inv => inv.invoiceId === documentId);
                if (document) {
                    customer = config.customers.find(c => c.name === document.customer) || null;
                    const template = config.templates.find(t => t.id === config.profile.defaultInvoiceTemplate);
                    if (template) {
                        setPages(JSON.parse(JSON.stringify(template.pages)));
                    }
                    setLiveDataContext({ invoice: document, customer });
                }
            } else if (documentType === 'quotation') {
                document = config.quotations.find(q => q.quotationId === documentId);
                if (document) {
                    customer = config.customers.find(c => c.name === document.customer) || null;
                    // You might have a default quotation template setting in the future
                    // const template = config.templates.find(t => t.id === config.profile.defaultQuotationTemplate);
                    // if(template) { setPages(JSON.parse(JSON.stringify(template.pages))) }
                    setLiveDataContext({ quotation: document, customer });
                }
            }
        }
    }, [searchParams, config, setLiveDataContext, setPages]);


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
