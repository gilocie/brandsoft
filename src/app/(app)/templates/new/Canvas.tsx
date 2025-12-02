
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useCanvasStore, type CanvasElement as CanvasElementType } from '@/stores/canvas-store';
import { Button } from '@/components/ui/button';
import { Plus, Copy, PlusSquare, RefreshCcw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const CanvasElement = ({ element }: { element: CanvasElementType }) => {
    const { updateElement, selectElement, commitHistory, selectedElementId, zoom } = useCanvasStore();
    const isSelected = selectedElementId === element.id;

    const dragStartPos = useRef({ x: 0, y: 0 });

    const handleDragStart = (e: React.MouseEvent) => {
        e.stopPropagation();
        selectElement(element.id);
        dragStartPos.current = { x: e.clientX, y: e.clientY };

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const dx = (moveEvent.clientX - dragStartPos.current.x) / zoom;
            const dy = (moveEvent.clientY - dragStartPos.current.y) / zoom;
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

const RulerGuide = ({ id, orientation, position }: { id: string; orientation: 'horizontal' | 'vertical'; position: number }) => {
    const { updateGuide, deleteGuide, commitHistory, zoom } = useCanvasStore();
    const rulerSize = 24; // Corresponds to w-6/h-6 on rulers

    const style = orientation === 'horizontal' 
      ? { top: position, left: 0, width: '100%', height: '1px', cursor: 'ns-resize' }
      : { left: position, top: 0, height: '100%', width: '1px', cursor: 'ew-resize' };
  
    const handleMouseDown = (e: React.MouseEvent) => {
      e.stopPropagation();
      const startPos = orientation === 'horizontal' ? e.clientY : e.clientX;
  
      const handleMouseMove = (moveEvent: MouseEvent) => {
        const currentPos = orientation === 'horizontal' ? moveEvent.clientY : moveEvent.clientX;
        const delta = (currentPos - startPos) / zoom;
        updateGuide(id, orientation === 'horizontal' ? { y: position + delta } : { x: position + delta });
      };
  
      const handleMouseUp = (upEvent: MouseEvent) => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
  
        const finalPos = orientation === 'horizontal' ? upEvent.clientY : upEvent.clientX;
        if (finalPos < rulerSize) {
          deleteGuide(id);
        }
        commitHistory();
      };
  
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };
  
    return (
      <div
        style={style}
        className="absolute bg-blue-400 z-20"
        onMouseDown={handleMouseDown}
      />
    );
  };
  

const Ruler = ({ orientation, zoom, canvasPosition }: { orientation: 'horizontal' | 'vertical', zoom: number, canvasPosition: {x: number, y:number} }) => {
    const rulerRef = useRef<HTMLDivElement>(null);
    const [ticks, setTicks] = useState<number[]>([]);

    useEffect(() => {
        if (!rulerRef.current) return;
        
        const size = orientation === 'horizontal' ? rulerRef.current.offsetWidth : rulerRef.current.offsetHeight;
        const newTicks = [];
        
        const baseIntervals = [1, 2, 5, 10, 25, 50, 100, 200, 500, 1000];
        const minPixelsPerTick = 40;
        let interval = baseIntervals[0];
        for(const i of baseIntervals) {
            if (i * zoom > minPixelsPerTick) {
                interval = i;
                break;
            }
        }

        const startValue = -Math.round((orientation === 'horizontal' ? canvasPosition.x : canvasPosition.y) / zoom);

        const firstTick = Math.floor(startValue / interval) * interval;
        const lastTick = startValue + Math.ceil(size / zoom);

        for (let i = firstTick; i < lastTick; i += interval) {
             newTicks.push(i);
        }
        setTicks(newTicks);

    }, [zoom, canvasPosition, orientation, rulerRef.current?.offsetWidth, rulerRef.current?.offsetHeight]);

    const getTickPosition = (tick: number) => {
        const offset = (orientation === 'horizontal' ? canvasPosition.x : canvasPosition.y);
        return (tick * zoom) + offset;
    }

    return (
        <div ref={rulerRef} className="absolute inset-0 overflow-hidden">
            {ticks.map(tick => (
                <div key={tick} className="absolute" style={orientation === 'horizontal' ? { top: 0, left: getTickPosition(tick), height: '100%'} : { left: 0, top: getTickPosition(tick), width: '100%'}}>
                    {orientation === 'horizontal' ? (
                        <>
                            <div className="w-px h-1.5 bg-gray-500" />
                            <span className="absolute top-2 -translate-x-1/2 text-gray-400">{tick}</span>
                        </>
                    ) : (
                         <>
                            <div className="h-px w-1.5 bg-gray-500 ml-auto" />
                            <span className="absolute left-1 -translate-y-1/2 text-gray-400" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>{tick}</span>
                        </>
                    )}
                </div>
            ))}
        </div>
    );
};


const Canvas = ({ onPageDoubleClick }: { onPageDoubleClick: () => void }) => {
    const { elements, addElement, selectElement, zoom, setZoom, canvasPosition, setCanvasPosition, rulers, guides, addGuide, pageDetails, updatePageDetails, commitHistory } = useCanvasStore();
    const mainCanvasRef = useRef<HTMLDivElement>(null);
    const pageRef = useRef<HTMLDivElement>(null);
    const dragStart = useRef({ x: 0, y: 0, canvasX: 0, canvasY: 0 });
    
    const centerCanvas = () => {
         if(mainCanvasRef.current) {
            const canvasRect = mainCanvasRef.current.getBoundingClientRect();
            const pageWidthInPixels = pageDetails.width * 96; // Approximate conversion
            const pageHeightInPixels = pageDetails.height * 96;

            setCanvasPosition({
                x: (canvasRect.width / 2) - (pageWidthInPixels / 2),
                y: (canvasRect.height / 2) - (pageHeightInPixels / 2)
            });
            setZoom(1);
        }
    }


    const handleCanvasPan = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target !== mainCanvasRef.current && e.target !== pageRef.current) return;
        
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
        const pageRect = pageRef.current.getBoundingClientRect();
        
        let tempGuide: HTMLDivElement | null = null;
        if(mainCanvasRef.current) {
            tempGuide = document.createElement('div');
            tempGuide.style.position = 'absolute';
            tempGuide.style.backgroundColor = 'rgba(0, 150, 255, 0.5)';
            if(orientation === 'horizontal') {
                tempGuide.style.width = '100%';
                tempGuide.style.height = '1px';
                tempGuide.style.left = '0';
                tempGuide.style.top = `${startEvent.clientY}px`;
            } else {
                tempGuide.style.width = '1px';
                tempGuide.style.height = '100%';
                tempGuide.style.top = '0';
                tempGuide.style.left = `${startEvent.clientX}px`;
            }
            mainCanvasRef.current.appendChild(tempGuide);
        }

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if(tempGuide) {
                 if (orientation === 'horizontal') {
                    tempGuide.style.top = `${moveEvent.clientY}px`;
                } else {
                    tempGuide.style.left = `${moveEvent.clientX}px`;
                }
            }
        };

        const handleMouseUp = (upEvent: MouseEvent) => {
            if(tempGuide && mainCanvasRef.current) {
                mainCanvasRef.current.removeChild(tempGuide);
            }
            
            let finalPosition;
            if (orientation === 'horizontal') {
                finalPosition = (upEvent.clientY - pageRect.top) / zoom;
            } else {
                finalPosition = (upEvent.clientX - pageRect.left) / zoom;
            }
            
            addGuide(orientation, finalPosition);
            commitHistory();
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const rect = mainCanvasRef.current!.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (e.ctrlKey || e.metaKey || e.altKey) { // Zoom
            const zoomFactor = 1 - e.deltaY * 0.001;
            const newZoom = Math.max(0.1, Math.min(5, zoom * zoomFactor));

            const newPosX = mouseX - (mouseX - canvasPosition.x) * zoomFactor;
            const newPosY = mouseY - (mouseY - canvasPosition.y) * zoomFactor;

            setZoom(newZoom);
            setCanvasPosition({x: newPosX, y: newPosY});

        } else { // Pan
            setCanvasPosition({
                x: canvasPosition.x - e.deltaX,
                y: canvasPosition.y - e.deltaY
            });
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (!mainCanvasRef.current) return;
        const dataString = e.dataTransfer.getData('application/json');
        if (!dataString) return;

        const elementData = JSON.parse(dataString);
        
        const rect = pageRef.current!.getBoundingClientRect();
        
        const x = (e.clientX - rect.left) / zoom;
        const y = (e.clientY - rect.top) / zoom;
        
        const newElement = {
            ...elementData,
            x,
            y,
        };
        addElement(newElement, { select: true });
    };
    
    // Center canvas on initial load
    useEffect(() => {
        centerCanvas();
    }, []);
    
    const handleCanvasClick = (e: React.MouseEvent) => {
        if (e.target === mainCanvasRef.current || e.target === pageRef.current) {
            selectElement(null);
        }
    }

    return (
        <main 
            ref={mainCanvasRef}
            className="flex-1 bg-gray-200 overflow-hidden relative cursor-grab active:cursor-grabbing"
            onMouseDown={handleCanvasPan}
            onClick={handleCanvasClick}
            onDoubleClick={(e) => {
                 if (e.target === mainCanvasRef.current || e.target === pageRef.current) {
                    onPageDoubleClick();
                }
            }}
            onWheel={handleWheel}
            onContextMenu={(e) => e.preventDefault()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
        >
             {/* Rulers */}
            {rulers.visible && (
                <>
                    <div 
                        className="absolute top-0 left-6 h-6 w-[calc(100%-1.5rem)] bg-gray-800 text-white text-xs z-30 cursor-crosshair"
                        onMouseDown={(e) => handleRulerDrag('horizontal', e)}
                    >
                         <Ruler orientation="horizontal" zoom={zoom} canvasPosition={{ x: canvasPosition.x, y: 0 }} />
                    </div>
                    <div 
                        className="absolute left-0 top-6 w-6 h-[calc(100%-1.5rem)] bg-gray-800 text-white text-xs z-30 cursor-crosshair"
                        onMouseDown={(e) => handleRulerDrag('vertical', e)}
                    >
                        <Ruler orientation="vertical" zoom={zoom} canvasPosition={{ y: canvasPosition.y, x: 0 }} />
                    </div>
                    <div className="absolute top-0 left-0 h-6 w-6 bg-gray-800 z-30"/>
                </>
            )}

            <div
                className="absolute"
                style={{
                    transform: `translate(${canvasPosition.x}px, ${canvasPosition.y}px) scale(${zoom})`,
                    transformOrigin: 'top left',
                }}
            >
                <TooltipProvider>
                    <div 
                        className="absolute z-30 flex items-center gap-1"
                        style={{
                        top: '-36px',
                        right: '0'
                        }}
                    >
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="default" size="icon" className="h-8 w-8 shadow-md">
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Duplicate Page</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="default" size="icon" className="h-8 w-8 shadow-md">
                                    <PlusSquare className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Add Page</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="default" size="icon" onClick={centerCanvas} className="h-8 w-8 shadow-md">
                                    <RefreshCcw className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Reset View</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </TooltipProvider>

                <div
                    ref={pageRef}
                    className="relative bg-white shadow-lg overflow-hidden"
                    style={{ 
                        width: `${pageDetails.width}${pageDetails.unit}`, 
                        height: `${pageDetails.height}${pageDetails.unit}`,
                        backgroundColor: pageDetails.backgroundColor
                    }}
                >
                    {pageDetails.backgroundImage && (
                        <img src={pageDetails.backgroundImage} className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none" alt="background"/>
                    )}

                    {/* Guides */}
                    {guides.horizontal.map(guide => <RulerGuide key={guide.id} id={guide.id} orientation="horizontal" position={guide.y!} />)}
                    {guides.vertical.map(guide => <RulerGuide key={guide.id} id={guide.id} orientation="vertical" position={guide.x!} />)}
                    
                    {/* Elements */}
                    {elements.map(el => (
                        <CanvasElement key={el.id} element={el} />
                    ))}

                    {elements.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
                            <div className="text-center">
                                <p>Drag an element from a panel to add it</p>
                            </div>
                        </div>
                    )}
                </div>

                 <div 
                    className="absolute bottom-[-48px] left-1/2 -translate-x-1/2 z-30"
                 >
                    <Button variant="outline" className="bg-white shadow-md"><Plus className="mr-2 h-4 w-4" /> Add page</Button>
                </div>
            </div>
        </main>
    );
};

export default Canvas;

    