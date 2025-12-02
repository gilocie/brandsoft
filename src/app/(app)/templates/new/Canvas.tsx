'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useCanvasStore, type CanvasElement as CanvasElementType } from '@/stores/canvas-store';
import { Button } from '@/components/ui/button';
import { PlusSquare, RefreshCcw, RefreshCw, SlidersHorizontal, Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Hidden element for text measurement
const TextMeasure = () => (
    <div 
        id="text-measure" 
        style={{
            position: 'absolute',
            visibility: 'hidden',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
        }}
    />
);

// Resize handle component
const ResizeHandle = ({ 
    position, 
    cursor, 
    onMouseDown 
}: { 
    position: string; 
    cursor: string; 
    onMouseDown: (e: React.MouseEvent) => void;
}) => {
    const getPositionStyles = (): React.CSSProperties => {
        const base: React.CSSProperties = {
            position: 'absolute',
            width: '10px',
            height: '10px',
            backgroundColor: 'white',
            border: '2px solid #3b82f6',
            borderRadius: '50%',
            cursor,
            zIndex: 10,
        };

        switch (position) {
            case 'top-left':
                return { ...base, top: '-5px', left: '-5px' };
            case 'top-center':
                return { ...base, top: '-5px', left: '50%', transform: 'translateX(-50%)' };
            case 'top-right':
                return { ...base, top: '-5px', right: '-5px' };
            case 'middle-left':
                return { ...base, top: '50%', left: '-5px', transform: 'translateY(-50%)' };
            case 'middle-right':
                return { ...base, top: '50%', right: '-5px', transform: 'translateY(-50%)' };
            case 'bottom-left':
                return { ...base, bottom: '-5px', left: '-5px' };
            case 'bottom-center':
                return { ...base, bottom: '-5px', left: '50%', transform: 'translateX(-50%)' };
            case 'bottom-right':
                return { ...base, bottom: '-5px', right: '-5px' };
            default:
                return base;
        }
    };

    return (
        <div
            style={getPositionStyles()}
            onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onMouseDown(e);
            }}
        />
    );
};

// Text Element Component
const TextElement = ({ element, isSelected }: { element: CanvasElementType; isSelected: boolean }) => {
    const { updateElement, updateElementProps, selectElement, commitHistory, zoom } = useCanvasStore();
    const elementRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);
    
    const baseFontSize = element.props.fontSize || 14;
    const baseHeight = 40;
    const padding = 8;

    // Calculate current font size based on element height
    const getCurrentFontSize = useCallback(() => {
        const scaleFactor = element.height / baseHeight;
        return Math.max(8, Math.min(200, baseFontSize * scaleFactor));
    }, [element.height, baseFontSize]);

    // Measure text width
    const measureText = (text: string, fontSize: number): { width: number; height: number } => {
        const measure = document.getElementById('text-measure');
        if (!measure) return { width: 100, height: 20 };
        
        measure.style.fontSize = `${fontSize}px`;
        measure.style.fontFamily = element.props.fontFamily || 'inherit';
        measure.style.fontWeight = String(element.props.fontWeight || 400);
        measure.textContent = text;
        
        return {
            width: measure.offsetWidth,
            height: measure.offsetHeight
        };
    };

    // Get longest word width
    const getLongestWordWidth = (fontSize: number): number => {
        const text = element.props.text || '';
        const words = text.split(/\s+/);
        let maxWidth = 0;

        words.forEach(word => {
            const dims = measureText(word, fontSize);
            if (dims.width > maxWidth) {
                maxWidth = dims.width;
            }
        });

        return maxWidth + padding * 2;
    };

    // Calculate required height for given width
    const calculateRequiredHeight = (targetWidth: number, fontSize: number): number => {
        const text = element.props.text || '';
        const words = text.split(/\s+/);
        const lineHeight = fontSize * 1.3;
        const availableWidth = targetWidth - padding * 2;

        let lines = 1;
        let currentLineWidth = 0;

        words.forEach((word, index) => {
            const wordDims = measureText(word, fontSize);
            const spaceWidth = index > 0 ? measureText(' ', fontSize).width : 0;

            if (currentLineWidth + spaceWidth + wordDims.width > availableWidth && currentLineWidth > 0) {
                lines++;
                currentLineWidth = wordDims.width;
            } else {
                currentLineWidth += spaceWidth + wordDims.width;
            }
        });

        return lines * lineHeight + padding * 2;
    };

    // Handle dragging
    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).dataset.handle) return;
        
        e.stopPropagation();
        selectElement(element.id);

        const startPos = { x: e.clientX, y: e.clientY };
        const startElementPos = { x: element.x, y: element.y };

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const dx = (moveEvent.clientX - startPos.x) / zoom;
            const dy = (moveEvent.clientY - startPos.y) / zoom;
            updateElement(element.id, { 
                x: startElementPos.x + dx, 
                y: startElementPos.y + dy 
            });
        };

        const handleMouseUp = () => {
            commitHistory();
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // Handle resizing
    const handleResize = (e: React.MouseEvent, handle: string) => {
        e.stopPropagation();
        e.preventDefault();

        const startPos = { x: e.clientX, y: e.clientY };
        const original = { 
            x: element.x, 
            y: element.y, 
            width: element.width, 
            height: element.height 
        };

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const dx = (moveEvent.clientX - startPos.x) / zoom;
            const dy = (moveEvent.clientY - startPos.y) / zoom;

            let newX = original.x;
            let newY = original.y;
            let newWidth = original.width;
            let newHeight = original.height;

            const fontSize = getCurrentFontSize();
            const minWidth = getLongestWordWidth(fontSize);

            // Calculate new dimensions based on handle
            if (handle.includes('right')) {
                newWidth = Math.max(minWidth, original.width + dx);
            }
            if (handle.includes('left')) {
                const proposedWidth = original.width - dx;
                if (proposedWidth >= minWidth) {
                    newWidth = proposedWidth;
                    newX = original.x + dx;
                } else {
                    newWidth = minWidth;
                    newX = original.x + original.width - minWidth;
                }
            }
            if (handle.includes('bottom')) {
                newHeight = original.height + dy;
            }
            if (handle.includes('top')) {
                newHeight = original.height - dy;
                newY = original.y + dy;
            }

            // Ensure minimum height based on text content
            const requiredHeight = calculateRequiredHeight(newWidth, fontSize);
            if (newHeight < requiredHeight) {
                if (handle.includes('top')) {
                    newY = original.y + original.height - requiredHeight;
                }
                newHeight = requiredHeight;
            }

            // Minimum constraints
            newWidth = Math.max(30, newWidth);
            newHeight = Math.max(20, newHeight);

            updateElement(element.id, { 
                x: newX, 
                y: newY, 
                width: newWidth, 
                height: newHeight 
            });
        };

        const handleMouseUp = () => {
            commitHistory();
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const currentFontSize = getCurrentFontSize();

    return (
        <div
            ref={elementRef}
            onMouseDown={handleMouseDown}
            style={{
                position: 'absolute',
                left: element.x,
                top: element.y,
                width: element.width,
                height: element.height,
                transform: `rotate(${element.rotation}deg)`,
                cursor: 'move',
                zIndex: element.zIndex || 1,
            }}
        >
            {/* Text content - no background */}
            <div
                ref={textRef}
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    fontSize: `${currentFontSize}px`,
                    color: element.props.color || '#000000',
                    fontFamily: element.props.fontFamily || 'inherit',
                    fontWeight: element.props.fontWeight || 400,
                    padding: `${padding}px`,
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    whiteSpace: 'normal',
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    pointerEvents: 'none',
                }}
            >
                {element.props.text}
            </div>

            {/* Selection border and handles */}
            {isSelected && (
                <>
                    <div 
                        style={{
                            position: 'absolute',
                            inset: 0,
                            border: '2px dashed #3b82f6',
                            pointerEvents: 'none',
                        }}
                    />
                    <ResizeHandle position="top-left" cursor="nwse-resize" onMouseDown={(e) => handleResize(e, 'top-left')} />
                    <ResizeHandle position="top-center" cursor="ns-resize" onMouseDown={(e) => handleResize(e, 'top')} />
                    <ResizeHandle position="top-right" cursor="nesw-resize" onMouseDown={(e) => handleResize(e, 'top-right')} />
                    <ResizeHandle position="middle-left" cursor="ew-resize" onMouseDown={(e) => handleResize(e, 'left')} />
                    <ResizeHandle position="middle-right" cursor="ew-resize" onMouseDown={(e) => handleResize(e, 'right')} />
                    <ResizeHandle position="bottom-left" cursor="nesw-resize" onMouseDown={(e) => handleResize(e, 'bottom-left')} />
                    <ResizeHandle position="bottom-center" cursor="ns-resize" onMouseDown={(e) => handleResize(e, 'bottom')} />
                    <ResizeHandle position="bottom-right" cursor="nwse-resize" onMouseDown={(e) => handleResize(e, 'bottom-right')} />
                </>
            )}
        </div>
    );
};

// Shape Element Component
const ShapeElement = ({ element, isSelected }: { element: CanvasElementType; isSelected: boolean }) => {
    const { updateElement, selectElement, commitHistory, zoom } = useCanvasStore();

    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).dataset.handle) return;
        
        e.stopPropagation();
        selectElement(element.id);

        const startPos = { x: e.clientX, y: e.clientY };
        const startElementPos = { x: element.x, y: element.y };

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const dx = (moveEvent.clientX - startPos.x) / zoom;
            const dy = (moveEvent.clientY - startPos.y) / zoom;
            updateElement(element.id, { 
                x: startElementPos.x + dx, 
                y: startElementPos.y + dy 
            });
        };

        const handleMouseUp = () => {
            commitHistory();
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleResize = (e: React.MouseEvent, handle: string) => {
        e.stopPropagation();
        e.preventDefault();

        const startPos = { x: e.clientX, y: e.clientY };
        const original = { 
            x: element.x, 
            y: element.y, 
            width: element.width, 
            height: element.height 
        };

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const dx = (moveEvent.clientX - startPos.x) / zoom;
            const dy = (moveEvent.clientY - startPos.y) / zoom;

            let newX = original.x;
            let newY = original.y;
            let newWidth = original.width;
            let newHeight = original.height;

            if (handle.includes('right')) {
                newWidth = original.width + dx;
            }
            if (handle.includes('left')) {
                newWidth = original.width - dx;
                newX = original.x + dx;
            }
            if (handle.includes('bottom')) {
                newHeight = original.height + dy;
            }
            if (handle.includes('top')) {
                newHeight = original.height - dy;
                newY = original.y + dy;
            }

            // Minimum constraints
            if (newWidth < 20) {
                if (handle.includes('left')) {
                    newX = original.x + original.width - 20;
                }
                newWidth = 20;
            }
            if (newHeight < 20) {
                if (handle.includes('top')) {
                    newY = original.y + original.height - 20;
                }
                newHeight = 20;
            }

            updateElement(element.id, { 
                x: newX, 
                y: newY, 
                width: newWidth, 
                height: newHeight 
            });
        };

        const handleMouseUp = () => {
            commitHistory();
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // Build shape styles
    const shapeStyles: React.CSSProperties = {
        width: '100%',
        height: '100%',
        backgroundColor: element.props.backgroundColor || '#cccccc',
        borderRadius: element.props.borderRadius,
        clipPath: element.props.clipPath,
    };

    // Handle triangle (uses border trick)
    const isTriangle = element.props.borderBottom && element.props.borderLeft && element.props.borderRight;

    return (
        <div
            onMouseDown={handleMouseDown}
            style={{
                position: 'absolute',
                left: element.x,
                top: element.y,
                width: element.width,
                height: element.height,
                transform: `rotate(${element.rotation}deg)`,
                cursor: 'move',
                zIndex: element.zIndex || 1,
            }}
        >
            {isTriangle ? (
                <div
                    style={{
                        width: 0,
                        height: 0,
                        borderBottom: element.props.borderBottom,
                        borderLeft: element.props.borderLeft,
                        borderRight: element.props.borderRight,
                        backgroundColor: 'transparent',
                    }}
                />
            ) : (
                <div style={shapeStyles} />
            )}

            {/* Selection border and handles */}
            {isSelected && (
                <>
                    <div 
                        style={{
                            position: 'absolute',
                            inset: 0,
                            border: '2px solid #10b981',
                            pointerEvents: 'none',
                        }}
                    />
                    <ResizeHandle position="top-left" cursor="nwse-resize" onMouseDown={(e) => handleResize(e, 'top-left')} />
                    <ResizeHandle position="top-center" cursor="ns-resize" onMouseDown={(e) => handleResize(e, 'top')} />
                    <ResizeHandle position="top-right" cursor="nesw-resize" onMouseDown={(e) => handleResize(e, 'top-right')} />
                    <ResizeHandle position="middle-left" cursor="ew-resize" onMouseDown={(e) => handleResize(e, 'left')} />
                    <ResizeHandle position="middle-right" cursor="ew-resize" onMouseDown={(e) => handleResize(e, 'right')} />
                    <ResizeHandle position="bottom-left" cursor="nesw-resize" onMouseDown={(e) => handleResize(e, 'bottom-left')} />
                    <ResizeHandle position="bottom-center" cursor="ns-resize" onMouseDown={(e) => handleResize(e, 'bottom')} />
                    <ResizeHandle position="bottom-right" cursor="nwse-resize" onMouseDown={(e) => handleResize(e, 'bottom-right')} />
                </>
            )}
        </div>
    );
};

// Image Element Component
const ImageElement = ({ element, isSelected }: { element: CanvasElementType; isSelected: boolean }) => {
    const { updateElement, selectElement, commitHistory, zoom } = useCanvasStore();

    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).dataset.handle) return;
        
        e.stopPropagation();
        selectElement(element.id);

        const startPos = { x: e.clientX, y: e.clientY };
        const startElementPos = { x: element.x, y: element.y };

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const dx = (moveEvent.clientX - startPos.x) / zoom;
            const dy = (moveEvent.clientY - startPos.y) / zoom;
            updateElement(element.id, { 
                x: startElementPos.x + dx, 
                y: startElementPos.y + dy 
            });
        };

        const handleMouseUp = () => {
            commitHistory();
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleResize = (e: React.MouseEvent, handle: string) => {
        e.stopPropagation();
        e.preventDefault();

        const startPos = { x: e.clientX, y: e.clientY };
        const original = { 
            x: element.x, 
            y: element.y, 
            width: element.width, 
            height: element.height 
        };

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const dx = (moveEvent.clientX - startPos.x) / zoom;
            const dy = (moveEvent.clientY - startPos.y) / zoom;

            let newX = original.x;
            let newY = original.y;
            let newWidth = original.width;
            let newHeight = original.height;

            if (handle.includes('right')) {
                newWidth = original.width + dx;
            }
            if (handle.includes('left')) {
                newWidth = original.width - dx;
                newX = original.x + dx;
            }
            if (handle.includes('bottom')) {
                newHeight = original.height + dy;
            }
            if (handle.includes('top')) {
                newHeight = original.height - dy;
                newY = original.y + dy;
            }

            if (newWidth < 20) {
                if (handle.includes('left')) {
                    newX = original.x + original.width - 20;
                }
                newWidth = 20;
            }
            if (newHeight < 20) {
                if (handle.includes('top')) {
                    newY = original.y + original.height - 20;
                }
                newHeight = 20;
            }

            updateElement(element.id, { 
                x: newX, 
                y: newY, 
                width: newWidth, 
                height: newHeight 
            });
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
            style={{
                position: 'absolute',
                left: element.x,
                top: element.y,
                width: element.width,
                height: element.height,
                transform: `rotate(${element.rotation}deg)`,
                cursor: 'move',
                zIndex: element.zIndex || 1,
            }}
        >
            <img 
                src={element.props.src} 
                alt="canvas element" 
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    pointerEvents: 'none',
                }}
            />

            {isSelected && (
                <>
                    <div 
                        style={{
                            position: 'absolute',
                            inset: 0,
                            border: '2px solid #3b82f6',
                            pointerEvents: 'none',
                        }}
                    />
                    <ResizeHandle position="top-left" cursor="nwse-resize" onMouseDown={(e) => handleResize(e, 'top-left')} />
                    <ResizeHandle position="top-center" cursor="ns-resize" onMouseDown={(e) => handleResize(e, 'top')} />
                    <ResizeHandle position="top-right" cursor="nesw-resize" onMouseDown={(e) => handleResize(e, 'top-right')} />
                    <ResizeHandle position="middle-left" cursor="ew-resize" onMouseDown={(e) => handleResize(e, 'left')} />
                    <ResizeHandle position="middle-right" cursor="ew-resize" onMouseDown={(e) => handleResize(e, 'right')} />
                    <ResizeHandle position="bottom-left" cursor="nesw-resize" onMouseDown={(e) => handleResize(e, 'bottom-left')} />
                    <ResizeHandle position="bottom-center" cursor="ns-resize" onMouseDown={(e) => handleResize(e, 'bottom')} />
                    <ResizeHandle position="bottom-right" cursor="nwse-resize" onMouseDown={(e) => handleResize(e, 'bottom-right')} />
                </>
            )}
        </div>
    );
};

// Canvas Element Renderer
const CanvasElementRenderer = ({ element }: { element: CanvasElementType }) => {
    const { selectedElementId } = useCanvasStore();
    const isSelected = selectedElementId === element.id;

    switch (element.type) {
        case 'text':
            return <TextElement element={element} isSelected={isSelected} />;
        case 'shape':
            return <ShapeElement element={element} isSelected={isSelected} />;
        case 'image':
            return <ImageElement element={element} isSelected={isSelected} />;
        default:
            return null;
    }
};

// Ruler Guide Component
const RulerGuide = ({ id, orientation, position }: { id: string; orientation: 'horizontal' | 'vertical'; position: number }) => {
    const { updateGuide, deleteGuide, commitHistory, zoom } = useCanvasStore();
    const rulerSize = 24;

    const style: React.CSSProperties = orientation === 'horizontal'
        ? { top: position, left: 0, width: '100%', height: '1px', cursor: 'ns-resize' }
        : { left: position, top: 0, height: '100%', width: '1px', cursor: 'ew-resize' };

    const handleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        const startPos = orientation === 'horizontal' ? e.clientY : e.clientX;
        const startPosition = position;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const currentPos = orientation === 'horizontal' ? moveEvent.clientY : moveEvent.clientX;
            const delta = (currentPos - startPos) / zoom;
            updateGuide(id, orientation === 'horizontal' ? { y: startPosition + delta } : { x: startPosition + delta });
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
            style={{ ...style, position: 'absolute', backgroundColor: '#60a5fa', zIndex: 20 }}
            onMouseDown={handleMouseDown}
        />
    );
};

// Ruler Component
const Ruler = ({ orientation, zoom, canvasPosition }: { orientation: 'horizontal' | 'vertical', zoom: number, canvasPosition: { x: number, y: number } }) => {
    const rulerRef = useRef<HTMLDivElement>(null);
    const [ticks, setTicks] = useState<number[]>([]);

    useEffect(() => {
        if (!rulerRef.current) return;

        const size = orientation === 'horizontal' ? rulerRef.current.offsetWidth : rulerRef.current.offsetHeight;
        const newTicks = [];

        const baseIntervals = [1, 2, 5, 10, 25, 50, 100, 200, 500, 1000];
        const minPixelsPerTick = 40;
        let interval = baseIntervals[0];
        for (const i of baseIntervals) {
            if (i * zoom > minPixelsPerTick) {
                interval = i;
                break;
            }
        }

        const offset = orientation === 'horizontal' ? canvasPosition.x : canvasPosition.y;
        const startValue = -Math.round(offset / zoom);
        const firstTick = Math.floor(startValue / interval) * interval;
        const lastTick = startValue + Math.ceil(size / zoom);

        for (let i = firstTick; i < lastTick; i += interval) {
            newTicks.push(i);
        }
        setTicks(newTicks);

    }, [zoom, canvasPosition, orientation]);

    const getTickPosition = (tick: number) => {
        const offset = orientation === 'horizontal' ? canvasPosition.x : canvasPosition.y;
        return (tick * zoom) + offset;
    };

    return (
        <div ref={rulerRef} className="absolute inset-0 overflow-hidden">
            {ticks.map(tick => (
                <div 
                    key={tick} 
                    className="absolute" 
                    style={orientation === 'horizontal' 
                        ? { top: 0, left: getTickPosition(tick), height: '100%' } 
                        : { left: 0, top: getTickPosition(tick), width: '100%' }
                    }
                >
                    {orientation === 'horizontal' ? (
                        <>
                            <div className="w-px h-1.5 bg-gray-500" />
                            <span className="absolute top-2 -translate-x-1/2 text-gray-400 text-xs">{tick}</span>
                        </>
                    ) : (
                        <>
                            <div className="h-px w-1.5 bg-gray-500 ml-auto" />
                            <span 
                                className="absolute left-1 -translate-y-1/2 text-gray-400 text-xs" 
                                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                            >
                                {tick}
                            </span>
                        </>
                    )}
                </div>
            ))}
        </div>
    );
};

// Main Canvas Component
const Canvas = ({ onPageDoubleClick }: { onPageDoubleClick: () => void }) => {
    const { 
        elements, 
        addElement, 
        selectElement, 
        deleteElement,
        selectedElementId,
        zoom, 
        setZoom, 
        canvasPosition, 
        setCanvasPosition, 
        rulers, 
        guides, 
        addGuide, 
        pageDetails, 
        commitHistory, 
        undo, 
        redo, 
        historyIndex, 
        history 
    } = useCanvasStore();
    
    const mainCanvasRef = useRef<HTMLDivElement>(null);
    const pageRef = useRef<HTMLDivElement>(null);
    const dragStart = useRef({ x: 0, y: 0, canvasX: 0, canvasY: 0 });

    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) {
                e.preventDefault();
                deleteElement(selectedElementId);
            }

            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z') {
                    e.preventDefault();
                    if (e.shiftKey) {
                        redo();
                    } else {
                        undo();
                    }
                }
                if (e.key === 'y') {
                    e.preventDefault();
                    redo();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [selectedElementId, deleteElement, undo, redo]);

    const handleCanvasPan = (e: React.MouseEvent<HTMLDivElement>) => {
        // Only pan if clicking on the canvas background
        if (e.target !== mainCanvasRef.current && e.target !== pageRef.current) return;

        e.preventDefault();
        dragStart.current = { 
            x: e.clientX, 
            y: e.clientY, 
            canvasX: canvasPosition.x, 
            canvasY: canvasPosition.y 
        };

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const dx = moveEvent.clientX - dragStart.current.x;
            const dy = moveEvent.clientY - dragStart.current.y;
            setCanvasPosition({ 
                x: dragStart.current.canvasX + dx, 
                y: dragStart.current.canvasY + dy 
            });
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
        if (!pageRef.current || !mainCanvasRef.current) return;

        const pageRect = pageRef.current.getBoundingClientRect();

        let tempGuide: HTMLDivElement | null = document.createElement('div');
        tempGuide.style.position = 'fixed';
        tempGuide.style.backgroundColor = 'rgba(0, 150, 255, 0.7)';
        tempGuide.style.zIndex = '9999';
        
        if (orientation === 'horizontal') {
            tempGuide.style.width = '100vw';
            tempGuide.style.height = '2px';
            tempGuide.style.left = '0';
            tempGuide.style.top = `${startEvent.clientY}px`;
        } else {
            tempGuide.style.width = '2px';
            tempGuide.style.height = '100vh';
            tempGuide.style.top = '0';
            tempGuide.style.left = `${startEvent.clientX}px`;
        }
        document.body.appendChild(tempGuide);

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (tempGuide) {
                if (orientation === 'horizontal') {
                    tempGuide.style.top = `${moveEvent.clientY}px`;
                } else {
                    tempGuide.style.left = `${moveEvent.clientX}px`;
                }
            }
        };

        const handleMouseUp = (upEvent: MouseEvent) => {
            if (tempGuide) {
                document.body.removeChild(tempGuide);
                tempGuide = null;
            }

            let finalPosition;
            if (orientation === 'horizontal') {
                finalPosition = (upEvent.clientY - pageRect.top) / zoom;
            } else {
                finalPosition = (upEvent.clientX - pageRect.left) / zoom;
            }

            // Only add guide if dropped on the page
            if (
                (orientation === 'horizontal' && upEvent.clientY > pageRect.top && upEvent.clientY < pageRect.bottom) ||
                (orientation === 'vertical' && upEvent.clientX > pageRect.left && upEvent.clientX < pageRect.right)
            ) {
                addGuide(orientation, finalPosition);
                commitHistory();
            }

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

        if (e.ctrlKey || e.metaKey || e.altKey) {
            // Zoom
            const zoomFactor = 1 - e.deltaY * 0.001;
            const newZoom = Math.max(0.1, Math.min(5, zoom * zoomFactor));

            const newPosX = mouseX - (mouseX - canvasPosition.x) * (newZoom / zoom);
            const newPosY = mouseY - (mouseY - canvasPosition.y) * (newZoom / zoom);

            setZoom(newZoom);
            setCanvasPosition({ x: newPosX, y: newPosY });
        } else {
            // Pan
            setCanvasPosition({
                x: canvasPosition.x - e.deltaX,
                y: canvasPosition.y - e.deltaY
            });
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        
        if (!pageRef.current) return;
        
        const dataString = e.dataTransfer.getData('application/json');
        if (!dataString) return;

        try {
            const elementData = JSON.parse(dataString);
            const pageRect = pageRef.current.getBoundingClientRect();

            // Calculate position relative to the page, accounting for zoom
            const x = (e.clientX - pageRect.left) / zoom - (elementData.width / 2);
            const y = (e.clientY - pageRect.top) / zoom - (elementData.height / 2);

            const newElement = {
                ...elementData,
                x: Math.max(0, x),
                y: Math.max(0, y),
            };

            addElement(newElement, { select: true });
        } catch (error) {
            console.error('Failed to parse dropped element data:', error);
        }
    };

    const resetView = () => {
        if (mainCanvasRef.current && pageRef.current) {
            const canvasRect = mainCanvasRef.current.getBoundingClientRect();
            const pageWidthInPixels = pageRef.current.offsetWidth;
            const pageHeightInPixels = pageRef.current.offsetHeight;

            setCanvasPosition({
                x: (canvasRect.width / 2) - (pageWidthInPixels / 2),
                y: (canvasRect.height / 2) - (pageHeightInPixels / 2)
            });
            setZoom(1);
        }
    };

    // Center canvas on initial load
    useEffect(() => {
        const timer = setTimeout(resetView, 100);
        return () => clearTimeout(timer);
    }, []);

    const handleCanvasClick = (e: React.MouseEvent) => {
        if (e.target === mainCanvasRef.current || e.target === pageRef.current) {
            selectElement(null);
        }
    };

    // Sort elements by zIndex for rendering
    const sortedElements = [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

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
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {/* Text measurement element */}
            <TextMeasure />

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
                    <div className="absolute top-0 left-0 h-6 w-6 bg-gray-800 z-30" />
                </>
            )}

            <div
                className="absolute"
                style={{
                    transform: `translate(${canvasPosition.x}px, ${canvasPosition.y}px) scale(${zoom})`,
                    transformOrigin: 'top left',
                }}
            >
                {/* Toolbar above page */}
                <div
                    className="absolute z-30 flex items-center gap-1"
                    style={{
                        top: '-36px',
                        right: '0'
                    }}
                >
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant="default" 
                                    size="icon" 
                                    onClick={undo} 
                                    disabled={!canUndo} 
                                    className="h-8 w-8 shadow-md"
                                >
                                    <RefreshCcw className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Undo (Ctrl+Z)</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant="default" 
                                    size="icon" 
                                    onClick={redo} 
                                    disabled={!canRedo} 
                                    className="h-8 w-8 shadow-md"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Redo (Ctrl+Y)</p>
                            </TooltipContent>
                        </Tooltip>
                        {selectedElementId && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button 
                                        variant="destructive" 
                                        size="icon" 
                                        onClick={() => deleteElement(selectedElementId)} 
                                        className="h-8 w-8 shadow-md"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Delete (Del)</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button 
                                    variant="default" 
                                    size="icon" 
                                    onClick={onPageDoubleClick} 
                                    className="h-8 w-8 shadow-md"
                                >
                                    <SlidersHorizontal className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Toggle Properties</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                {/* Page */}
                <div
                    ref={pageRef}
                    className="relative bg-white shadow-lg"
                    style={{
                        width: `${pageDetails.width}${pageDetails.unit}`,
                        height: `${pageDetails.height}${pageDetails.unit}`,
                        backgroundColor: pageDetails.backgroundColor
                    }}
                >
                    {pageDetails.backgroundImage && (
                        <img 
                            src={pageDetails.backgroundImage} 
                            className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none" 
                            alt="background" 
                        />
                    )}

                    {/* Guides */}
                    {guides.horizontal.map(guide => (
                        <RulerGuide key={guide.id} id={guide.id} orientation="horizontal" position={guide.y!} />
                    ))}
                    {guides.vertical.map(guide => (
                        <RulerGuide key={guide.id} id={guide.id} orientation="vertical" position={guide.x!} />
                    ))}

                    {/* Elements */}
                    {sortedElements.map(el => (
                        <CanvasElementRenderer key={el.id} element={el} />
                    ))}

                    {elements.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
                            <div className="text-center">
                                <p>Drag an element from a panel to add it</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Add page button */}
                <div
                    className="absolute left-1/2 -translate-x-1/2 z-30"
                    style={{
                        top: `calc(${pageDetails.height}${pageDetails.unit} + 16px)`
                    }}
                >
                    <Button variant="outline" className="bg-white shadow-md">
                        <PlusSquare className="mr-2 h-4 w-4" /> Add page
                    </Button>
                </div>
            </div>
        </main>
    );
};

export default Canvas;