
'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useCanvasStore, type CanvasElement as CanvasElementType } from '@/stores/canvas-store';
import { Button } from '@/components/ui/button';
import { PlusSquare, RefreshCcw, RefreshCw, SlidersHorizontal, Trash2, Link, Unlink, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { loadGoogleFonts } from './canvas/utils';
import { TextElement, ShapeElement, ImageElement } from './canvas/elements';
import { Ruler, RulerGuide, PageBackground, SelectionBox } from './canvas/ui';

const TextMeasure = () => <div id="text-measure" style={{ position: 'absolute', visibility: 'hidden', whiteSpace: 'nowrap', pointerEvents: 'none' }} />;

// Multi-select bounding box
const MultiSelectBox = ({ elementIds }: { elementIds: string[] }) => {
    const { pages, currentPageIndex } = useCanvasStore();
    const elements = pages[currentPageIndex]?.elements || [];
    const selectedElements = elements.filter(el => elementIds.includes(el.id));
    
    if (selectedElements.length < 2) return null;

    const minX = Math.min(...selectedElements.map(el => el.x));
    const minY = Math.min(...selectedElements.map(el => el.y));
    const maxX = Math.max(...selectedElements.map(el => el.x + el.width));
    const maxY = Math.max(...selectedElements.map(el => el.y + el.height));

    return (
        <div
            style={{
                position: 'absolute',
                left: minX - 2,
                top: minY - 2,
                width: maxX - minX + 4,
                height: maxY - minY + 4,
                border: '2px dashed #3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.05)',
                pointerEvents: 'none',
                zIndex: 999,
            }}
        />
    );
};

const CanvasElementRenderer = ({ element }: { element: CanvasElementType }) => {
    const { selectedElementId, selectedElementIds } = useCanvasStore();
    const isSelected = selectedElementId === element.id || selectedElementIds.includes(element.id);
    
    if (element.groupId) return null;
    
    switch (element.type) {
        case 'text': return <TextElement element={element} isSelected={isSelected} />;
        case 'shape': return <ShapeElement element={element} isSelected={isSelected} />;
        case 'image': return <ImageElement element={element} isSelected={isSelected} />;
        case 'group': return <GroupElement element={element} isSelected={isSelected} />;
        default: return null;
    }
};

const GroupElement = ({ element, isSelected }: { element: CanvasElementType; isSelected: boolean }) => {
    const { pages, currentPageIndex, updateElement, selectElement, commitHistory, zoom, ungroupElement } = useCanvasStore();
    const elements = pages[currentPageIndex]?.elements || [];
    const childElements = elements.filter(el => element.childIds?.includes(el.id));

    const handleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        selectElement(element.id);

        const startPos = { x: e.clientX, y: e.clientY };
        const startElementPos = { x: element.x, y: element.y };

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const dx = (moveEvent.clientX - startPos.x) / zoom;
            const dy = (moveEvent.clientY - startPos.y) / zoom;
            updateElement(element.id, { x: startElementPos.x + dx, y: startElementPos.y + dy });
        };

        const handleMouseUp = () => {
            commitHistory();
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <div
            onMouseDown={handleMouseDown}
            onDoubleClick={() => ungroupElement(element.id)}
            style={{
                position: 'absolute',
                left: element.x,
                top: element.y,
                width: element.width,
                height: element.height,
                cursor: 'move',
                zIndex: element.zIndex || 1,
            }}
        >
            {childElements.map(child => {
                const ChildRenderer = child.type === 'text' ? TextElement : 
                                      child.type === 'shape' ? ShapeElement : ImageElement;
                return (
                    <div key={child.id} style={{ position: 'absolute', left: child.x, top: child.y }}>
                        <ChildRenderer element={{ ...child, x: 0, y: 0 }} isSelected={false} />
                    </div>
                );
            })}

            {isSelected && (
                <>
                    <div style={{ position: 'absolute', inset: -2, border: '2px dashed #8b5cf6', pointerEvents: 'none' }} />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-violet-500 text-white text-xs px-2 py-1 rounded">
                        Group (double-click to ungroup)
                    </div>
                </>
            )}
        </div>
    );
};

interface CanvasProps { onPageDoubleClick: () => void; }

const Canvas = ({ onPageDoubleClick }: CanvasProps) => {
    const mainCanvasRef = useRef<HTMLDivElement>(null);
    const pageRef = useRef<HTMLDivElement>(null);
    const dragStart = useRef({ x: 0, y: 0, canvasX: 0, canvasY: 0 });
    
    const [isClient, setIsClient] = useState(false);
    const [isCtrlPressed, setIsCtrlPressed] = useState(false);
    const [pageToDelete, setPageToDelete] = useState<number | null>(null);

    const {
        pages, currentPageIndex, addElement, selectElement, deleteElement, selectedElementId, selectedElementIds, moveElement,
        zoom, setZoom, canvasPosition, setCanvasPosition, rulers, guides, addGuide, addPage,
        setActivePage, deletePage,
        updatePageBackground, commitHistory, undo, redo, historyIndex, history,
        isBackgroundRepositioning, setBackgroundRepositioning,
        selectionBox, setSelectionBox, getElementsInSelectionBox, selectMultipleElements,
        linkSelectedElements, groupSelectedElements, setNewPageDialogOpen
    } = useCanvasStore();

    const currentPage = pages[currentPageIndex];
    const pageDetails = currentPage?.pageDetails;

    const resetView = () => {
        if (!mainCanvasRef.current || !pageRef.current || !pageDetails) return;

        const canvasRect = mainCanvasRef.current.getBoundingClientRect();
        
        // Convert page dimensions to pixels for consistent scaling
        const DPI = 96;
        let pageWidthPx = pageDetails.width;
        let pageHeightPx = pageDetails.height;

        if (pageDetails.unit === 'in') {
            pageWidthPx *= DPI;
            pageHeightPx *= DPI;
        } else if (pageDetails.unit === 'cm') {
            pageWidthPx = (pageWidthPx / 2.54) * DPI;
            pageHeightPx = (pageHeightPx / 2.54) * DPI;
        }

        const PADDING = 80; // pixels
        const availableWidth = canvasRect.width - PADDING;
        const availableHeight = canvasRect.height - PADDING;
        
        const scaleX = availableWidth / pageWidthPx;
        const scaleY = availableHeight / pageHeightPx;
        
        const scaleFactor = Math.min(scaleX, scaleY);
        
        setZoom(scaleFactor);
        setCanvasPosition({
            x: (canvasRect.width - (pageWidthPx * scaleFactor)) / 2,
            y: (canvasRect.height - (pageHeightPx * scaleFactor)) / 2,
        });
    };
    
    useEffect(() => { setIsClient(true); }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) setIsCtrlPressed(true);
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if ((e.key === 'Delete' || e.key === 'Backspace') && (selectedElementId || selectedElementIds.length > 0)) {
                e.preventDefault();
                const idsToDelete = selectedElementId ? [selectedElementId] : selectedElementIds;
                idsToDelete.forEach(id => deleteElement(id));
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
            if ((e.ctrlKey || e.metaKey) && e.key === 'g' && selectedElementIds.length > 1) { e.preventDefault(); groupSelectedElements(); }
            if ((e.ctrlKey || e.metaKey) && e.key === 'l' && selectedElementIds.length > 1) { e.preventDefault(); linkSelectedElements(); }
            if (e.key === 'Escape') {
                if (isBackgroundRepositioning) setBackgroundRepositioning(false);
                if (selectionBox) setSelectionBox(null);
            }
            if (selectedElementId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                const amount = e.shiftKey ? 10 : 1;
                moveElement(selectedElementId, e.key as any, amount);
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => { if (!e.ctrlKey && !e.metaKey) setIsCtrlPressed(false); };
        
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
        };
    }, [selectedElementId, selectedElementIds, isBackgroundRepositioning, selectionBox, deleteElement, redo, undo, groupSelectedElements, linkSelectedElements, setBackgroundRepositioning, setSelectionBox, moveElement]);

    useEffect(() => { loadGoogleFonts(); }, []);
    
    useEffect(() => {
      const t = setTimeout(resetView, 100); 
      return () => clearTimeout(t); 
    }, [currentPageIndex, pageDetails?.width, pageDetails?.height]);

    const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target !== mainCanvasRef.current && e.target !== pageRef.current) return;
        if (isBackgroundRepositioning) { setBackgroundRepositioning(false); return; }

        const pageRect = pageRef.current?.getBoundingClientRect();
        if (!pageRect) return;

        if ((e.ctrlKey || e.metaKey) && e.button === 0) {
            e.preventDefault();
            const startX = (e.clientX - pageRect.left) / zoom;
            const startY = (e.clientY - pageRect.top) / zoom;
            setSelectionBox({ startX, startY, endX: startX, endY: startY, isSelecting: true });

            const handleMouseMove = (moveEvent: MouseEvent) => {
                const endX = (moveEvent.clientX - pageRect.left) / zoom;
                const endY = (moveEvent.clientY - pageRect.top) / zoom;
                setSelectionBox({ startX, startY, endX, endY, isSelecting: true });
            };
            const handleMouseUp = () => {
                const box = useCanvasStore.getState().selectionBox;
                if (box) {
                    const selectedIds = getElementsInSelectionBox(box);
                    selectMultipleElements(selectedIds);
                }
                setSelectionBox(null);
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return;
        }

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
        if (isBackgroundRepositioning && pageDetails) {
            updatePageBackground({ scale: Math.max(0.5, Math.min(3, (pageDetails.background.scale || 1) * (e.deltaY > 0 ? 0.95 : 1.05))) });
            return;
        }
        if (e.ctrlKey || e.metaKey || e.altKey) {
            const rect = mainCanvasRef.current!.getBoundingClientRect();
            const mouseX = e.clientX - rect.left, mouseY = e.clientY - rect.top;
            const factor = 1 - e.deltaY * 0.001;
            const newZoom = Math.max(0.1, Math.min(5, zoom * factor));
            setZoom(newZoom);
            setCanvasPosition({ x: mouseX - (mouseX - canvasPosition.x) * (newZoom / zoom), y: mouseY - (mouseY - canvasPosition.y) * (newZoom / zoom) });
        } else {
            setCanvasPosition({ x: canvasPosition.x - e.deltaX, y: canvasPosition.y - e.deltaY });
        }
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

    const handleCanvasClick = (e: React.MouseEvent) => { if (e.target === mainCanvasRef.current || e.target === pageRef.current) { if (!e.ctrlKey && !e.metaKey) { selectElement(null); } } };
    const handleDeletePage = () => { if (pageToDelete !== null) { deletePage(pageToDelete); setPageToDelete(null); } };
    
    if (!isClient) {
        return <main className="flex-1 bg-gray-200" />;
    }

    if (!currentPage || !pageDetails) {
        return (
             <main ref={mainCanvasRef} className="flex-1 bg-gray-200 overflow-hidden relative flex items-center justify-center">
                <div className="text-center">
                    <p className="text-muted-foreground mb-4">No page exists. Please create one.</p>
                    <Button onClick={() => setNewPageDialogOpen(true)}> <PlusSquare className="mr-2 h-4 w-4" /> Create New Page </Button>
                </div>
            </main>
        );
    }
    
    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;
    const hasMultiSelect = selectedElementIds.length > 1;
    const sortedElements = [...currentPage.elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    return (
        <main
            ref={mainCanvasRef}
            className={`flex-1 bg-gray-200 overflow-hidden relative ${isCtrlPressed ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}`}
            onMouseDown={handleCanvasMouseDown}
            onClick={handleCanvasClick}
            onDoubleClick={(e) => { if (e.target === mainCanvasRef.current || e.target === pageRef.current) onPageDoubleClick(); }}
            onWheel={handleWheel}
            onContextMenu={(e) => e.preventDefault()}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
            onDrop={handleDrop}
        >
            <TextMeasure />
            {isCtrlPressed && <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs px-3 py-1 rounded-full z-50 pointer-events-none">Drag to select multiple elements</div>}
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
                        {hasMultiSelect && (
                            <>
                                <Tooltip><TooltipTrigger asChild><Button variant="secondary" size="icon" onClick={linkSelectedElements} className="h-8 w-8 shadow-md"><Link className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Link Elements (Ctrl+L)</p></TooltipContent></Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild><Button variant="secondary" size="icon" onClick={groupSelectedElements} className="h-8 w-8 shadow-md"><svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg></Button></TooltipTrigger>
                                    <TooltipContent><p>Group Elements (Ctrl+G)</p></TooltipContent>
                                </Tooltip>
                            </>
                        )}
                        {(selectedElementId || selectedElementIds.length > 0) && (
                            <Tooltip><TooltipTrigger asChild><Button variant="destructive" size="icon" onClick={() => (selectedElementId ? deleteElement(selectedElementId) : selectedElementIds.forEach(deleteElement))} className="h-8 w-8 shadow-md"><Trash2 className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Delete (Del)</p></TooltipContent></Tooltip>
                        )}
                        <Tooltip><TooltipTrigger asChild><Button variant="default" size="icon" onClick={onPageDoubleClick} className="h-8 w-8 shadow-md"><SlidersHorizontal className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Toggle Properties</p></TooltipContent></Tooltip>
                    </TooltipProvider>
                </div>
                {hasMultiSelect && <div className="absolute z-30 bg-blue-500 text-white text-xs px-2 py-1 rounded" style={{ top: '-36px', left: '0' }}>{selectedElementIds.length} elements selected</div>}
                
                <div id={`page-${currentPageIndex}`} ref={pageRef} className="relative bg-white shadow-lg" style={{ width: `${pageDetails.width}${pageDetails.unit}`, height: `${pageDetails.height}${pageDetails.unit}`, background: pageDetails.backgroundColor }}>
                    <PageBackground />
                    {guides.horizontal.map(g => <RulerGuide key={g.id} id={g.id} orientation="horizontal" position={g.y!} />)}
                    {guides.vertical.map(g => <RulerGuide key={g.id} id={g.id} orientation="vertical" position={g.x!} />)}
                    <MultiSelectBox elementIds={selectedElementIds} />
                    {selectionBox?.isSelecting && <SelectionBox {...selectionBox} />}
                    {sortedElements.map(el => <CanvasElementRenderer key={el.id} element={el} />)}
                    {currentPage.elements.length === 0 && <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none"><p>Drag an element from a panel to add it</p></div>}
                </div>
                
                <div className="absolute left-1/2 -translate-x-1/2 z-30 flex items-center gap-4" style={{ top: `calc(${pageDetails.height}${pageDetails.unit} + 16px)` }}>
                    {pages.map((p, i) => (
                        <div key={p.id} className="relative group/page-thumb">
                            <div onClick={() => setActivePage(i)} className={`cursor-pointer border-2 p-1 rounded-md ${i === currentPageIndex ? 'border-primary' : 'border-gray-300'}`}>
                                <div className="w-16 h-20 bg-white" />
                                <p className="text-xs text-center mt-1">{`Page ${i + 1}`}</p>
                            </div>
                             {pages.length > 0 && (
                                <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-5 w-5 rounded-full opacity-0 group-hover/page-thumb:opacity-100 transition-opacity" onClick={() => setPageToDelete(i)}>
                                    <X className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    ))}
                    <Button variant="outline" size="sm" className="bg-white shadow-md" onClick={addPage}><PlusSquare className="mr-2 h-4 w-4" /> Add Page</Button>
                </div>
            </div>
            
            <AlertDialog open={pageToDelete !== null} onOpenChange={(open) => !open && setPageToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>{`This will permanently delete Page ${pageToDelete !== null ? pageToDelete + 1 : ''}.`}</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel onClick={() => setPageToDelete(null)}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeletePage}>Delete Page</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </main>
    );
};

export default Canvas;
