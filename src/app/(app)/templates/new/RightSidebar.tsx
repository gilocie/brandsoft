'use client';

import React from 'react';
import { useCanvasStore } from '@/stores/canvas-store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Link, Unlink } from 'lucide-react';

import {
    ActionsPanel,
    PositionPanel,
    OpacityPanel,
    ShapeFillPanel,
    ShapeStrokePanel,
    ShapeRadiusPanel,
    ShapeShadowPanel,
    ShapeImagePanel,
    TextContentPanel,
    TextStylePanel,
    PageDimensionsPanel,
    PageBackgroundPanel,
    TemplatePanel,
} from './sidebar/panels';

// Multi-select actions panel
const MultiSelectActionsPanel = () => {
    const { selectedElementIds, linkSelectedElements, groupSelectedElements, clearSelection } = useCanvasStore();

    if (selectedElementIds.length < 2) return null;

    return (
        <div className="p-3 border-b space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium">{selectedElementIds.length} elements selected</span>
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={clearSelection}>
                    Clear
                </Button>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={linkSelectedElements}>
                    <Link className="h-3 w-3 mr-1" />
                    Link
                </Button>
                <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={groupSelectedElements}>
                    Group
                </Button>
            </div>
        </div>
    );
};

const ElementPropertiesContent = () => {
    const { selectedElementId, selectedElementIds, pages, currentPageIndex } = useCanvasStore();
    const elements = pages[currentPageIndex]?.elements || [];
    
    // Multi-select mode
    if (selectedElementIds.length > 1) {
        return (
            <div className="space-y-0">
                <MultiSelectActionsPanel />
                <div className="p-4 text-center text-xs text-muted-foreground">
                    Select a single element to edit its properties
                </div>
            </div>
        );
    }

    const element = elements.find(el => el.id === selectedElementId);

    if (!element) {
        return (
            <div className="p-4 text-center text-sm text-muted-foreground">
                Select an element to edit its properties
            </div>
        );
    }

    return (
        <div className="space-y-0">
            <ActionsPanel />
            <Accordion
                type="multiple"
                defaultValue={['position', 'opacity', 'fill', 'stroke', 'radius', 'shadow', 'text-content', 'text-style']}
                className="w-full"
            >
                <PositionPanel />
                <OpacityPanel />

                {element.type === 'shape' && (
                    <>
                        <ShapeFillPanel />
                        <ShapeStrokePanel />
                        <ShapeRadiusPanel />
                        <ShapeShadowPanel />
                        <ShapeImagePanel />
                    </>
                )}

                {element.type === 'text' && (
                    <>
                        <TextContentPanel />
                        <TextStylePanel />
                    </>
                )}

                <TemplatePanel />
            </Accordion>
        </div>
    );
};

const PagePropertiesContent = () => {
    return (
        <div className="py-1">
            <Accordion
                type="multiple"
                defaultValue={['dimensions', 'background', 'template']}
                className="w-full"
            >
                <PageDimensionsPanel />
                <PageBackgroundPanel />
                <TemplatePanel />
            </Accordion>
        </div>
    );
};

interface RightSidebarProps {
    onCollapse: () => void;
    position: { x: number; y: number };
    setPosition: (position: { x: number; y: number }) => void;
}

const RightSidebar = ({ onCollapse, position, setPosition }: RightSidebarProps) => {
    const { selectedElementId, selectedElementIds, pages, currentPageIndex } = useCanvasStore();
    const elements = pages[currentPageIndex]?.elements || [];
    const selectedElement = elements.find(el => el.id === selectedElementId);


    const dragStartPos = React.useRef({ x: 0, y: 0 });
    const panelStartPos = React.useRef({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        panelStartPos.current = position;
        e.preventDefault();

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const dx = moveEvent.clientX - dragStartPos.current.x;
            const dy = moveEvent.clientY - dragStartPos.current.y;
            setPosition({
                x: panelStartPos.current.x - dx,
                y: panelStartPos.current.y + dy,
            });
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const getTitle = () => {
        if (selectedElementIds.length > 1) return `${selectedElementIds.length} Selected`;
        if (!selectedElement) return 'Properties';
        const typeLabels: Record<string, string> = { text: 'Text', shape: 'Shape', image: 'Image', group: 'Group' };
        return `${typeLabels[selectedElement.type] || 'Element'}`;
    };

    return (
        <Card
            className="absolute w-64 z-20 flex flex-col shadow-lg"
            style={{ 
                top: position.y, 
                right: position.x,
                height: 'calc(100vh - 140px)',
                maxHeight: '600px',
            }}
        >
            {/* Header - Compact */}
            <div
                className="px-3 py-1.5 border-b flex items-center justify-between bg-primary rounded-t-lg cursor-grab active:cursor-grabbing shrink-0"
                onMouseDown={handleMouseDown}
            >
                <span className="text-xs font-medium text-primary-foreground">
                    {getTitle()}
                </span>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onCollapse}
                    className="text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground cursor-pointer h-6 w-6"
                >
                    <X className="h-3 w-3" />
                </Button>
            </div>

            {/* Content */}
            <Tabs
                defaultValue={selectedElementId ? 'element' : 'page'}
                value={selectedElementId || selectedElementIds.length > 0 ? 'element' : 'page'}
                className="flex-1 flex flex-col overflow-hidden"
            >
                <TabsList className="w-full rounded-none border-b shrink-0 h-8">
                    <TabsTrigger
                        value="element"
                        className="flex-1 text-xs h-7"
                        disabled={!selectedElementId && selectedElementIds.length === 0}
                    >
                        Element
                    </TabsTrigger>
                    <TabsTrigger value="page" className="flex-1 text-xs h-7">
                        Page
                    </TabsTrigger>
                </TabsList>

                <ScrollArea className="flex-1">
                    <TabsContent value="element" className="mt-0 p-0">
                        <ElementPropertiesContent />
                    </TabsContent>

                    <TabsContent value="page" className="mt-0 p-0">
                        <PagePropertiesContent />
                    </TabsContent>
                </ScrollArea>
            </Tabs>
        </Card>
    );
};

export default RightSidebar;
