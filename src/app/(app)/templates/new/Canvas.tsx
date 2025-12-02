
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useCanvasStore, type CanvasElement as CanvasElementType } from '@/stores/canvas-store';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const CanvasElement = ({ element }: { element: CanvasElementType }) => {
    const { updateElement, selectElement, commitHistory, selectedElementId } = useCanvasStore();
    const isSelected = selectedElementId === element.id;

    const dragStartPos = useRef({ x: 0, y: 0 });

    const handleDragStart = (e: React.MouseEvent) => {
        e.stopPropagation();
        selectElement(element.id);
        dragStartPos.current = { x: e.clientX, y: e.clientY };

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const dx = moveEvent.clientX - dragStartPos.current.x;
            const dy = moveEvent.clientY - dragStartPos.current.y;
            dragStartPos.current = { x: moveEvent.clientX, y: moveEvent.clientY };
            updateElement(element.id, { x: element.x + dx, y: element.y + dy });
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
            onMouseDown={handleDragStart}
            style={{
                position: 'absolute',
                left: element.x,
                top: element.y,
                width: element.width,
                height: element.height,
                transform: `rotate(${element.rotation}deg)`,
                cursor: 'grab'
            }}
            className={cn(isSelected && 'outline outline-2 outline-blue-500 outline-offset-2')}
        >
            {element.type === 'text' && <p style={{ ...element.props, width: '100%', height: '100%' }}>{element.props.text}</p>}
            {element.type === 'image' && <img src={element.props.src} alt="canvas element" className="w-full h-full object-cover" />}
            {element.type === 'shape' && <div className="w-full h-full" style={{...element.props}}/>}
        </div>
    );
};

const RulerGuide = ({ orientation, position }: { orientation: 'horizontal' | 'vertical', position: number }) => {
  const style = orientation === 'horizontal' 
    ? { top: position, left: 0, width: '100%', height: '1px' }
    : { left: position, top: 0, height: '100%', width: '1px' };

  return (
    <div
      style={style}
      className="absolute bg-blue-400 z-20 pointer-events-none"
    />
  );
};

const HorizontalRuler = ({ zoom, canvasPosition }: { zoom: number, canvasPosition: { x: number, y: number } }) => {
    const rulerRef = useRef<HTMLDivElement>(null);
    const [ticks, setTicks] = useState<number[]>([]);

    useEffect(() => {
        if (!rulerRef.current) return;
        const width = rulerRef.current.offsetWidth;
        const newTicks: number[] = [];
        // Adjust interval based on zoom level for readability
        const interval = zoom > 0.8 ? 50 : (zoom > 0.3 ? 100 : 200);
        const start = -Math.round(canvasPosition.x / (interval * zoom)) * interval;
        
        for (let i = start - interval * 5; i < start + width / zoom + interval * 5; i += interval) {
             if (i >= 0) newTicks.push(i);
        }
        setTicks(newTicks);
    }, [zoom, canvasPosition.x, rulerRef.current?.offsetWidth]);

    return (
        <div ref={rulerRef} className="absolute top-0 left-0 h-6 w-full bg-gray-800 text-white text-xs overflow-hidden">
             <div className="absolute top-0 h-full" style={{ left: canvasPosition.x * zoom }}>
                {ticks.map(tick => (
                    <div key={`h-${tick}`} className="absolute top-0 h-full" style={{ left: tick * zoom }}>
                        <div className="w-px h-1.5 bg-gray-500" />
                        <span className="absolute top-2 -translate-x-1/2">{tick}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const VerticalRuler = ({ zoom, canvasPosition }: { zoom: number, canvasPosition: { x: number, y: number } }) => {
    const rulerRef = useRef<HTMLDivElement>(null);
    const [ticks, setTicks] = useState<number[]>([]);

    useEffect(() => {
        if (!rulerRef.current) return;
        const height = rulerRef.current.offsetHeight;
        const newTicks: number[] = [];
        const interval = zoom > 0.8 ? 50 : (zoom > 0.3 ? 100 : 200);
        const start = -Math.round(canvasPosition.y / (interval * zoom)) * interval;
        
        for (let i = start - interval * 5; i < start + height / zoom + interval * 5; i += interval) {
             if (i >= 0) newTicks.push(i);
        }
        setTicks(newTicks);

    }, [zoom, canvasPosition.y, rulerRef.current?.offsetHeight]);

    return (
        <div ref={rulerRef} className="absolute left-0 top-0 w-6 h-full bg-gray-800 text-white text-xs overflow-hidden">
            <div className="absolute left-0 w-full" style={{ top: canvasPosition.y * zoom }}>
                {ticks.map(tick => (
                    <div key={`v-${tick}`} className="absolute left-0 w-full" style={{ top: tick * zoom }}>
                        <div className="h-px w-1.5 bg-gray-500 ml-auto" />
                        <span className="absolute left-1 -translate-y-1/2" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>{tick}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const Canvas = () => {
    const { elements, selectElement, zoom, setZoom, canvasPosition, setCanvasPosition, rulers, guides, addGuide } = useCanvasStore();
    const mainCanvasRef = useRef<HTMLDivElement>(null);
    const pageRef = useRef<HTMLDivElement>(null);
    const dragStart = useRef({ x: 0, y: 0, canvasX: 0, canvasY: 0 });

    const handleCanvasPan = (e: React.MouseEvent<HTMLDivElement>) => {
        const isPageOrElement = pageRef.current?.contains(e.target as Node) || (e.target as HTMLElement).closest('[data-element-id]');
        if (isPageOrElement && !(e.target === pageRef.current)) {
            return;
        }

        e.preventDefault();
        dragStart.current = { x: e.clientX, y: e.clientY, canvasX: canvasPosition.x, canvasY: canvasPosition.y };

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const dx = moveEvent.clientX - dragStart.current.x;
            const dy = moveEvent.clientY - dragStart.current.y;
            setCanvasPosition({ x: dragStart.current.canvasX + dx, y: dragStart.current.canvasY + dy });
        };
        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleRulerDrag = (orientation: 'horizontal' | 'vertical', startEvent: React.MouseEvent) => {
        startEvent.preventDefault();
        if (!pageRef.current) return;
        const canvasRect = pageRef.current.getBoundingClientRect();
        
        const handleMouseMove = (moveEvent: MouseEvent) => {
            let position;
            if (orientation === 'horizontal') {
                position = (moveEvent.clientY - canvasRect.top) / zoom;
            } else {
                position = (moveEvent.clientX - canvasRect.left) / zoom;
            }
            // A temporary guide could be shown here
        };

        const handleMouseUp = (upEvent: MouseEvent) => {
            let finalPosition;
            if (orientation === 'horizontal') {
                finalPosition = (upEvent.clientY - canvasRect.top) / zoom;
            } else {
                finalPosition = (upEvent.clientX - canvasRect.left) / zoom;
            }
             if(finalPosition > 0) { // Simple check to not add guides outside canvas
                addGuide(orientation, finalPosition);
            }
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();

        if (e.altKey) {
            // Zooming
            const newZoom = zoom - e.deltaY * 0.001;
            setZoom(newZoom);
        } else {
            // Panning
            setCanvasPosition({
                x: canvasPosition.x - e.deltaX,
                y: canvasPosition.y - e.deltaY
            });
        }
    };

    return (
        <main 
            ref={mainCanvasRef}
            className="flex-1 bg-gray-200 p-8 overflow-hidden relative cursor-grab active:cursor-grabbing"
            onMouseDown={handleCanvasPan}
            onClick={() => selectElement(null)}
            onWheel={handleWheel}
        >
             {/* Rulers */}
            {rulers.visible && (
                <>
                    <div 
                        className="absolute top-0 left-6 h-6 w-[calc(100%-1.5rem)] cursor-ns-resize z-30"
                        onMouseDown={(e) => handleRulerDrag('horizontal', e)}
                    >
                         <HorizontalRuler zoom={zoom} canvasPosition={canvasPosition}/>
                    </div>
                    <div 
                        className="absolute left-0 top-6 w-6 h-[calc(100%-1.5rem)] cursor-ew-resize z-30"
                        onMouseDown={(e) => handleRulerDrag('vertical', e)}
                    >
                        <VerticalRuler zoom={zoom} canvasPosition={canvasPosition}/>
                    </div>
                    <div className="absolute top-0 left-0 h-6 w-6 bg-gray-800 z-30"/>
                </>
            )}

             <div 
                className="relative cursor-default flex items-center justify-center"
                 style={{
                    width: '100%',
                    height: '100%',
                }}
                onMouseDown={(e) => e.stopPropagation()} // Stop propagation to not deselect when clicking on page
            >
                <div
                    className="absolute"
                    style={{
                        transform: `translate(${canvasPosition.x}px, ${canvasPosition.y}px) scale(${zoom})`,
                        transformOrigin: 'top left',
                        left: '50%',
                        top: '50%',
                        marginLeft: `-${(8.5/2)}in`,
                        marginTop: `-${(11/2)}in`,
                    }}
                >

                    <div
                        ref={pageRef}
                        className="relative bg-white shadow-lg"
                        style={{ 
                            width: '8.5in', 
                            height: '11in',
                        }}
                    >
                        {/* Guides */}
                        {guides.horizontal.map(guide => <RulerGuide key={guide.id} orientation="horizontal" position={guide.y!} />)}
                        {guides.vertical.map(guide => <RulerGuide key={guide.id} orientation="vertical" position={guide.x!} />)}
                        
                        {/* Elements */}
                        {elements.map(el => (
                            <CanvasElement key={el.id} element={el} />
                        ))}

                        {elements.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
                                <div className="text-center">
                                    <p>Click an element from the left panel to add it</p>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                        <Button variant="outline" className="bg-white"><Plus className="mr-2 h-4 w-4" /> Add page</Button>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default Canvas;
