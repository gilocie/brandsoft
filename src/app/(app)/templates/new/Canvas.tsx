'use client';

import React, { useRef, useEffect } from 'react';
import { useCanvasStore, type CanvasElement as CanvasElementType } from '@/stores/canvas-store';
import { Button } from '@/components/ui/button';
import { PlusSquare, RefreshCcw, RefreshCw, SlidersHorizontal, Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { loadGoogleFonts } from './canvas/utils';
import { TextElement, ShapeElement, ImageElement } from './canvas/elements';
import { Ruler, RulerGuide, PageBackground } from './canvas/ui';

const TextMeasure = () => <div id="text-measure" style={{ position: 'absolute', visibility: 'hidden', whiteSpace: 'nowrap', pointerEvents: 'none' }} />;

const CanvasElementRenderer = ({ element }: { element: CanvasElementType }) => {
    const { selectedElementId } = useCanvasStore();
    const isSelected = selectedElementId === element.id;
    switch (element.type) {
        case 'text': return <TextElement element={element} isSelected={isSelected} />;
        case 'shape': return <ShapeElement element={element} isSelected={isSelected} />;
        case 'image': return <ImageElement element={element} isSelected={isSelected} />;
        default: return null;
    }
};

interface CanvasProps { onPageDoubleClick: () => void; }

const Canvas = ({ onPageDoubleClick }: CanvasProps) => {
    const { elements, addElement, selectElement, deleteElement, selectedElementId, moveElement, zoom, setZoom, canvasPosition, setCanvasPosition, rulers, guides, addGuide, pageDetails, updatePageBackground, commitHistory, undo, redo, historyIndex, history, isBackgroundRepositioning, setBackgroundRepositioning } = useCanvasStore();
    const mainCanvasRef = useRef<HTMLDivElement>(null);
    const pageRef = useRef<HTMLDivElement>(null);
    const dragStart = useRef({ x: 0, y: 0, canvasX: 0, canvasY: 0 });

    const canUndo = historyIndex > 0, canRedo = historyIndex < history.length - 1;

    useEffect(() => { loadGoogleFonts(); }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) { e.preventDefault(); deleteElement(selectedElementId); }
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
            if (e.key === 'Escape' && isBackgroundRepositioning) setBackgroundRepositioning(false);
            if (selectedElementId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                const amount = e.shiftKey ? 10 : 1;
                moveElement(selectedElementId, e.key === 'ArrowUp' ? 'up' : e.key === 'ArrowDown' ? 'down' : e.key === 'ArrowLeft' ? 'left' : 'right', amount);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [selectedElementId, isBackgroundRepositioning, moveElement, deleteElement, undo, redo, setBackgroundRepositioning]);

    const handleCanvasPan = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target !== mainCanvasRef.current && e.target !== pageRef.current) return;
        if (isBackgroundRepositioning) { setBackgroundRepositioning(false); return; }
        e.preventDefault();
        dragStart.current = { x: e.clientX, y: e.clientY, canvasX: canvasPosition.x, canvasY: canvasPosition.y };
        const handleMouseMove = (moveEvent: MouseEvent) => { setCanvasPosition({ x: dragStart.current.canvasX + (moveEvent.clientX - dragStart.current.x), y: dragStart.current.canvasY + (moveEvent.clientY - dragStart.current.y) }); };
        const handleMouseUp = () => { document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleRulerDrag = (orientation: 'horizontal' | 'vertical', startEvent: React.MouseEvent) => {
        if (!pageRef.current) return;
        startEvent.preventDefault();
        const pageRect = pageRef.current.getBoundingClientRect();
        const tempGuide = document.createElement('div');
        tempGuide.style.cssText = `position:fixed;background:rgba(0,150,255,0.7);z-index:9999;${orientation === 'horizontal' ? 'width:100vw;height:2px;left:0;' : 'width:2px;height:100vh;top:0;'}`;
        tempGuide.style[orientation === 'horizontal' ? 'top' : 'left'] = `${orientation === 'horizontal' ? startEvent.clientY : startEvent.clientX}px`;
        document.body.appendChild(tempGuide);
        const handleMouseMove = (moveEvent: MouseEvent) => { tempGuide.style[orientation === 'horizontal' ? 'top' : 'left'] = `${orientation === 'horizontal' ? moveEvent.clientY : moveEvent.clientX}px`; };
        const handleMouseUp = (upEvent: MouseEvent) => {
            document.body.removeChild(tempGuide);
            const pos = orientation === 'horizontal' ? (upEvent.clientY - pageRect.top) / zoom : (upEvent.clientX - pageRect.left) / zoom;
            const inBounds = orientation === 'horizontal' ? upEvent.clientY > pageRect.top && upEvent.clientY < pageRect.bottom : upEvent.clientX > pageRect.left && upEvent.clientX < pageRect.right;
            if (inBounds) { addGuide(orientation, pos); commitHistory(); }
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        if (isBackgroundRepositioning) { updatePageBackground({ scale: Math.max(0.5, Math.min(3, (pageDetails.background.scale || 1) * (e.deltaY > 0 ? 0.95 : 1.05))) }); return; }
        const rect = mainCanvasRef.current!.getBoundingClientRect();
        const mouseX = e.clientX - rect.left, mouseY = e.clientY - rect.top;
        if (e.ctrlKey || e.metaKey || e.altKey) {
            const factor = 1 - e.deltaY * 0.001;
            const newZoom = Math.max(0.1, Math.min(5, zoom * factor));
            setZoom(newZoom);
            setCanvasPosition({ x: mouseX - (mouseX - canvasPosition.x) * (newZoom / zoom), y: mouseY - (mouseY - canvasPosition.y) * (newZoom / zoom) });
        } else { setCanvasPosition({ x: canvasPosition.x - e.deltaX, y: canvasPosition.y - e.deltaY }); }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (!pageRef.current) return;
        const data = e.dataTransfer.getData('application/json');
        if (!data) return;
        try {
            const el = JSON.parse(data);
            const rect = pageRef.current.getBoundingClientRect();
            addElement({ ...el, x: Math.max(0, (e.clientX - rect.left) / zoom - el.width / 2), y: Math.max(0, (e.clientY - rect.top) / zoom - el.height / 2) }, { select: true });
        } catch (err) { console.error(err); }
    };

    const resetView = () => {
        if (!mainCanvasRef.current || !pageRef.current) return;
        const canvasRect = mainCanvasRef.current.getBoundingClientRect();
        setCanvasPosition({ x: (canvasRect.width - pageRef.current.offsetWidth) / 2, y: (canvasRect.height - pageRef.current.offsetHeight) / 2 });
        setZoom(1);
    };

    useEffect(() => { const t = setTimeout(resetView, 100); return () => clearTimeout(t); }, []);

    const handleCanvasClick = (e: React.MouseEvent) => { if (e.target === mainCanvasRef.current || e.target === pageRef.current) selectElement(null); };

    const sortedElements = [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    return (
        <main ref={mainCanvasRef} className="flex-1 bg-gray-200 overflow-hidden relative cursor-grab active:cursor-grabbing" onMouseDown={handleCanvasPan} onClick={handleCanvasClick} onDoubleClick={(e) => { if (e.target === mainCanvasRef.current || e.target === pageRef.current) onPageDoubleClick(); }} onWheel={handleWheel} onContextMenu={(e) => e.preventDefault()} onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }} onDrop={handleDrop}>
            <TextMeasure />
            {rulers.visible && (
                <>
                    <div className="absolute top-0 left-6 h-6 w-[calc(100%-1.5rem)] bg-gray-800 z-30 cursor-crosshair" onMouseDown={(e) => handleRulerDrag('horizontal', e)}><Ruler orientation="horizontal" zoom={zoom} canvasPosition={{ x: canvasPosition.x, y: 0 }} /></div>
                    <div className="absolute left-0 top-6 w-6 h-[calc(100%-1.5rem)] bg-gray-800 z-30 cursor-crosshair" onMouseDown={(e) => handleRulerDrag('vertical', e)}><Ruler orientation="vertical" zoom={zoom} canvasPosition={{ y: canvasPosition.y, x: 0 }} /></div>
                    <div className="absolute top-0 left-0 h-6 w-6 bg-gray-800 z-30" />
                </>
            )}
            <div className="absolute" style={{ transform: `translate(${canvasPosition.x}px, ${canvasPosition.y}px) scale(${zoom})`, transformOrigin: 'top left' }}>
                <div className="absolute z-30 flex items-center gap-1" style={{ top: '-36px', right: '0' }}>
                    <TooltipProvider>
                        <Tooltip><TooltipTrigger asChild><Button variant="default" size="icon" onClick={undo} disabled={!canUndo} className="h-8 w-8 shadow-md"><RefreshCcw className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Undo (Ctrl+Z)</p></TooltipContent></Tooltip>
                        <Tooltip><TooltipTrigger asChild><Button variant="default" size="icon" onClick={redo} disabled={!canRedo} className="h-8 w-8 shadow-md"><RefreshCw className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Redo (Ctrl+Y)</p></TooltipContent></Tooltip>
                        {selectedElementId && <Tooltip><TooltipTrigger asChild><Button variant="destructive" size="icon" onClick={() => deleteElement(selectedElementId)} className="h-8 w-8 shadow-md"><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Delete (Del)</p></TooltipContent></Tooltip>}
                        <Tooltip><TooltipTrigger asChild><Button variant="default" size="icon" onClick={onPageDoubleClick} className="h-8 w-8 shadow-md"><SlidersHorizontal className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Toggle Properties</p></TooltipContent></Tooltip>
                    </TooltipProvider>
                </div>
                <div ref={pageRef} className="relative bg-white shadow-lg" style={{ width: `${pageDetails.width}${pageDetails.unit}`, height: `${pageDetails.height}${pageDetails.unit}`, backgroundColor: pageDetails.backgroundColor }}>
                    <PageBackground />
                    {guides.horizontal.map(g => <RulerGuide key={g.id} id={g.id} orientation="horizontal" position={g.y!} />)}
                    {guides.vertical.map(g => <RulerGuide key={g.id} id={g.id} orientation="vertical" position={g.x!} />)}
                    {sortedElements.map(el => <CanvasElementRenderer key={el.id} element={el} />)}
                    {elements.length === 0 && <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none"><p>Drag an element from a panel to add it</p></div>}
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 z-30" style={{ top: `calc(${pageDetails.height}${pageDetails.unit} + 16px)` }}><Button variant="outline" className="bg-white shadow-md"><PlusSquare className="mr-2 h-4 w-4" /> Add page</Button></div>
            </div>
        </main>
    );
};

export default Canvas;
