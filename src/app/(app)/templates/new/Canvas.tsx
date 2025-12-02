'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useCanvasStore, type CanvasElement as CanvasElementType } from '@/stores/canvas-store';
import { Button } from '@/components/ui/button';
import { PlusSquare, RefreshCcw, RefreshCw, SlidersHorizontal, Trash2, RotateCw, Link, Unlink, ImagePlus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Google Fonts list
const GOOGLE_FONTS = [
    'Poppins', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Raleway',
    'Playfair Display', 'Merriweather', 'Nunito', 'Ubuntu', 'Oswald',
    'Source Sans Pro', 'Dancing Script', 'Pacifico', 'Lobster', 'Quicksand',
    'Bebas Neue', 'Abril Fatface', 'Comfortaa', 'Righteous'
];

// Load Google Fonts
const loadGoogleFonts = () => {
    if (typeof window === 'undefined') return;
    const existing = document.getElementById('google-fonts-link');
    if (existing) return;
    
    const link = document.createElement('link');
    link.id = 'google-fonts-link';
    link.href = `https://fonts.googleapis.com/css2?family=${GOOGLE_FONTS.map(f => f.replace(/ /g, '+')).join('&family=')}&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
};

// Export fonts list for use in other components
export { GOOGLE_FONTS };

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

// Rotation cursor
const getRotationCursor = () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 12 12, auto`;
};

// Snap lines visualization
const SnapLines = ({ snapInfo }: { snapInfo: { vertical: number | null; horizontal: number | null } }) => {
    if (!snapInfo.vertical && !snapInfo.horizontal) return null;
    
    return (
        <>
            {snapInfo.vertical !== null && (
                <div style={{ position: 'absolute', left: snapInfo.vertical, top: 0, width: 1, height: '100%', backgroundColor: '#ef4444', zIndex: 1000, pointerEvents: 'none' }} />
            )}
            {snapInfo.horizontal !== null && (
                <div style={{ position: 'absolute', left: 0, top: snapInfo.horizontal, width: '100%', height: 1, backgroundColor: '#ef4444', zIndex: 1000, pointerEvents: 'none' }} />
            )}
        </>
    );
};

// Resize handle component
const ResizeHandle = ({
    position, cursor, onMouseDown, onRotateStart
}: {
    position: string;
    cursor: string;
    onMouseDown: (e: React.MouseEvent) => void;
    onRotateStart?: (e: React.MouseEvent) => void;
}) => {
    const [isRotationZone, setIsRotationZone] = useState(false);
    const handleRef = useRef<HTMLDivElement>(null);

    const getPositionStyles = (): React.CSSProperties => {
        const base: React.CSSProperties = {
            position: 'absolute', width: '12px', height: '12px',
            backgroundColor: 'white', border: '2px solid #3b82f6',
            borderRadius: '50%', zIndex: 10,
        };
        const positions: Record<string, React.CSSProperties> = {
            'top-left': { top: '-6px', left: '-6px' },
            'top-center': { top: '-6px', left: '50%', transform: 'translateX(-50%)' },
            'top-right': { top: '-6px', right: '-6px' },
            'middle-left': { top: '50%', left: '-6px', transform: 'translateY(-50%)' },
            'middle-right': { top: '50%', right: '-6px', transform: 'translateY(-50%)' },
            'bottom-left': { bottom: '-6px', left: '-6px' },
            'bottom-center': { bottom: '-6px', left: '50%', transform: 'translateX(-50%)' },
            'bottom-right': { bottom: '-6px', right: '-6px' },
        };
        return { ...base, ...positions[position] };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!handleRef.current) return;
        const rect = handleRef.current.getBoundingClientRect();
        const distance = Math.sqrt(Math.pow(e.clientX - (rect.left + 6), 2) + Math.pow(e.clientY - (rect.top + 6), 2));
        setIsRotationZone(distance > 10);
    };

    return (
        <div
            ref={handleRef}
            style={{ ...getPositionStyles(), cursor: isRotationZone ? getRotationCursor() : cursor }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setIsRotationZone(false)}
            onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (isRotationZone && onRotateStart) onRotateStart(e);
                else onMouseDown(e);
            }}
        />
    );
};

// Rotation handle
const RotationHandle = ({ onRotateStart }: { onRotateStart: (e: React.MouseEvent) => void }) => (
    <>
        <div style={{ position: 'absolute', top: '-24px', left: '50%', transform: 'translateX(-50%)', width: '1px', height: '18px', backgroundColor: '#3b82f6', zIndex: 10 }} />
        <div
            style={{
                position: 'absolute', top: '-36px', left: '50%', transform: 'translateX(-50%)',
                width: '20px', height: '20px', backgroundColor: 'white', border: '2px solid #3b82f6',
                borderRadius: '50%', cursor: getRotationCursor(), display: 'flex',
                alignItems: 'center', justifyContent: 'center', zIndex: 11,
            }}
            onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); onRotateStart(e); }}
        >
            <RotateCw size={12} className="text-blue-500" />
        </div>
    </>
);

// Link indicator between elements
const LinkIndicator = ({ onUnlink }: { onUnlink: () => void }) => (
    <div style={{ position: 'absolute', top: '-28px', right: '-28px', zIndex: 1001 }}>
        <Button variant="secondary" size="icon" className="h-6 w-6 rounded-full shadow-md" onClick={(e) => { e.stopPropagation(); onUnlink(); }} title="Unlink">
            <Unlink className="h-3 w-3" />
        </Button>
    </div>
);

// Element wrapper with common functionality
const ElementWrapper = ({
    element, isSelected, children, minWidth = 20, minHeight = 20,
    onCalculateMinSize, borderColor = '#3b82f6', borderStyle = 'solid',
}: {
    element: CanvasElementType;
    isSelected: boolean;
    children: React.ReactNode;
    minWidth?: number;
    minHeight?: number;
    onCalculateMinSize?: () => { minWidth: number; minHeight: number };
    borderColor?: string;
    borderStyle?: 'solid' | 'dashed';
}) => {
    const { updateElement, selectElement, commitHistory, zoom, linkElements, unlinkElement, getSnapPosition, elements, isTemplateEditMode } = useCanvasStore();
    const elementRef = useRef<HTMLDivElement>(null);
    const [snapInfo, setSnapInfo] = useState<{ vertical: number | null; horizontal: number | null }>({ vertical: null, horizontal: null });
    const [showLinkButton, setShowLinkButton] = useState<string | null>(null);

    const isLinked = !!element.linkedElementId;
    const linkedParent = isLinked ? elements.find(el => el.id === element.linkedElementId) : null;
    const isEditable = !isTemplateEditMode || element.props.isTemplateField;

    // Handle dragging with snapping
    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('[data-handle]')) return;
        if (!isEditable && isTemplateEditMode) return;

        e.stopPropagation();
        selectElement(element.id);

        const startPos = { x: e.clientX, y: e.clientY };
        const startElementPos = { x: element.x, y: element.y };

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const dx = (moveEvent.clientX - startPos.x) / zoom;
            const dy = (moveEvent.clientY - startPos.y) / zoom;
            const newX = startElementPos.x + dx;
            const newY = startElementPos.y + dy;

            const snapped = getSnapPosition(element, newX, newY);
            updateElement(element.id, { x: snapped.x, y: snapped.y });

            // Show snap lines
            if (snapped.snappedToId) {
                const other = elements.find(el => el.id === snapped.snappedToId);
                if (other) {
                    setSnapInfo({
                        vertical: snapped.x !== newX ? snapped.x + element.width / 2 : null,
                        horizontal: snapped.y !== newY ? snapped.y + element.height / 2 : null,
                    });
                    // Show link button if text over shape
                    if (element.type === 'text' && other.type === 'shape') {
                        setShowLinkButton(other.id);
                    }
                }
            } else {
                setSnapInfo({ vertical: null, horizontal: null });
                setShowLinkButton(null);
            }
        };

        const handleMouseUp = () => {
            setSnapInfo({ vertical: null, horizontal: null });
            commitHistory();
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // Handle rotation
    const handleRotateStart = (e: React.MouseEvent) => {
        if (!elementRef.current) return;
        e.stopPropagation();
        e.preventDefault();

        const rect = elementRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        const startRotation = element.rotation;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const currentAngle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX);
            let angleDiff = (currentAngle - startAngle) * (180 / Math.PI);
            if (moveEvent.shiftKey) angleDiff = Math.round(angleDiff / 15) * 15;
            updateElement(element.id, { rotation: startRotation + angleDiff });
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
        const original = { x: element.x, y: element.y, width: element.width, height: element.height };

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const dx = (moveEvent.clientX - startPos.x) / zoom;
            const dy = (moveEvent.clientY - startPos.y) / zoom;
            let { x: newX, y: newY, width: newWidth, height: newHeight } = original;

            const mins = onCalculateMinSize ? onCalculateMinSize() : { minWidth, minHeight };

            if (handle.includes('right')) newWidth = Math.max(mins.minWidth, original.width + dx);
            if (handle.includes('left')) {
                const proposed = original.width - dx;
                if (proposed >= mins.minWidth) { newWidth = proposed; newX = original.x + dx; }
                else { newWidth = mins.minWidth; newX = original.x + original.width - mins.minWidth; }
            }
            if (handle.includes('bottom')) newHeight = Math.max(mins.minHeight, original.height + dy);
            if (handle.includes('top')) {
                const proposed = original.height - dy;
                if (proposed >= mins.minHeight) { newHeight = proposed; newY = original.y + dy; }
                else { newHeight = mins.minHeight; newY = original.y + original.height - mins.minHeight; }
            }

            updateElement(element.id, { x: newX, y: newY, width: newWidth, height: newHeight });
        };

        const handleMouseUp = () => {
            commitHistory();
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleLink = () => {
        if (showLinkButton) {
            linkElements(showLinkButton, element.id);
            setShowLinkButton(null);
        }
    };

    return (
        <>
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
                    transformOrigin: 'center center',
                    cursor: isEditable ? 'move' : 'default',
                    zIndex: element.zIndex || 1,
                    opacity: element.props.opacity ?? 1,
                }}
            >
                {children}

                {/* Template field indicator */}
                {element.props.isTemplateField && (
                    <div className="absolute -top-5 left-0 bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none">
                        {element.props.templateFieldName || element.props.templateFieldType}
                    </div>
                )}

                {/* Link suggestion button */}
                {showLinkButton && isSelected && (
                    <div className="absolute -top-8 right-0 z-50">
                        <Button variant="secondary" size="sm" className="h-6 text-xs shadow-md" onClick={handleLink}>
                            <Link className="h-3 w-3 mr-1" /> Link
                        </Button>
                    </div>
                )}

                {/* Selection UI */}
                {isSelected && isEditable && (
                    <>
                        <div style={{ position: 'absolute', inset: -1, border: `2px ${borderStyle} ${borderColor}`, pointerEvents: 'none' }} />
                        <RotationHandle onRotateStart={handleRotateStart} />
                        {isLinked && <LinkIndicator onUnlink={() => unlinkElement(element.id)} />}
                        <div data-handle="true">
                            {['top-left', 'top-center', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right'].map(pos => (
                                <ResizeHandle
                                    key={pos}
                                    position={pos}
                                    cursor={pos.includes('left') && pos.includes('top') ? 'nwse-resize' :
                                        pos.includes('right') && pos.includes('bottom') ? 'nwse-resize' :
                                        pos.includes('right') && pos.includes('top') ? 'nesw-resize' :
                                        pos.includes('left') && pos.includes('bottom') ? 'nesw-resize' :
                                        pos.includes('left') || pos.includes('right') ? 'ew-resize' : 'ns-resize'}
                                    onMouseDown={(e) => handleResize(e, pos)}
                                    onRotateStart={handleRotateStart}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
            <SnapLines snapInfo={snapInfo} />
        </>
    );
};

// Text Element
const TextElement = ({ element, isSelected }: { element: CanvasElementType; isSelected: boolean }) => {
    const { updateElementProps } = useCanvasStore();
    const baseFontSize = element.props.fontSize || 14;
    const baseHeight = 40;
    const padding = 8;

    const getCurrentFontSize = useCallback(() => {
        const scaleFactor = element.height / baseHeight;
        return Math.max(8, Math.min(200, baseFontSize * scaleFactor));
    }, [element.height, baseFontSize]);

    // Sync font size when resizing
    useEffect(() => {
        const newSize = getCurrentFontSize();
        if (Math.abs(newSize - baseFontSize) > 1) {
            updateElementProps(element.id, { fontSize: Math.round(newSize) });
        }
    }, [element.height]);

    const measureText = (text: string, fontSize: number) => {
        const measure = document.getElementById('text-measure');
        if (!measure) return { width: 100, height: 20 };
        measure.style.fontSize = `${fontSize}px`;
        measure.style.fontFamily = element.props.fontFamily || 'Arial';
        measure.style.fontWeight = String(element.props.fontWeight || 400);
        measure.textContent = text;
        return { width: measure.offsetWidth, height: measure.offsetHeight };
    };

    const calculateMinSize = () => {
        const fontSize = getCurrentFontSize();
        const text = element.props.text || '';
        const words = text.split(/\s+/);
        let maxWordWidth = 0;
        words.forEach(w => { const d = measureText(w, fontSize); if (d.width > maxWordWidth) maxWordWidth = d.width; });
        return { minWidth: Math.max(30, maxWordWidth + padding * 2), minHeight: Math.max(20, fontSize * 1.3 + padding * 2) };
    };

    return (
        <ElementWrapper element={element} isSelected={isSelected} onCalculateMinSize={calculateMinSize} borderStyle="dashed">
            <div
                style={{
                    width: '100%', height: '100%', display: 'flex',
                    alignItems: 'center', justifyContent: element.props.textAlign === 'left' ? 'flex-start' : element.props.textAlign === 'right' ? 'flex-end' : 'center',
                    textAlign: element.props.textAlign || 'center',
                    fontSize: `${getCurrentFontSize()}px`,
                    color: element.props.color || '#000000',
                    fontFamily: element.props.fontFamily || 'Arial',
                    fontWeight: element.props.fontWeight || 400,
                    lineHeight: element.props.lineHeight || 1.3,
                    letterSpacing: element.props.letterSpacing ? `${element.props.letterSpacing}px` : 'normal',
                    padding: `${padding}px`,
                    wordWrap: 'break-word', overflowWrap: 'break-word',
                    whiteSpace: 'normal', overflow: 'hidden', pointerEvents: 'none',
                }}
            >
                {element.props.text}
            </div>
        </ElementWrapper>
    );
};

// Shape Element
const ShapeElement = ({ element, isSelected }: { element: CanvasElementType; isSelected: boolean }) => {
    const { updateElementProps, commitHistory, isTemplateEditMode } = useCanvasStore();
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [isRepositioningImage, setIsRepositioningImage] = useState(false);

    const isTriangle = element.props.borderBottom && element.props.borderLeft && element.props.borderRight;

    const getBorderRadius = () => {
        const { borderTopLeftRadius = 0, borderTopRightRadius = 0, borderBottomRightRadius = 0, borderBottomLeftRadius = 0 } = element.props;
        return `${borderTopLeftRadius}px ${borderTopRightRadius}px ${borderBottomRightRadius}px ${borderBottomLeftRadius}px`;
    };

    const getShadow = () => {
        const { shadowColor, shadowBlur = 0, shadowOffsetX = 0, shadowOffsetY = 0, shadowSpread = 0, shadowInset } = element.props;
        if (!shadowColor && !shadowBlur) return 'none';
        return `${shadowInset ? 'inset ' : ''}${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px ${shadowSpread}px ${shadowColor || 'rgba(0,0,0,0.3)'}`;
    };

    const getFilter = () => element.props.blur ? `blur(${element.props.blur}px)` : 'none';

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                updateElementProps(element.id, { shapeImage: event.target?.result as string, shapeImageScale: 1, shapeImageOffsetX: 0, shapeImageOffsetY: 0 });
                commitHistory();
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImageDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsRepositioningImage(true);
    };

    const handleImageReposition = (e: React.MouseEvent) => {
        if (!isRepositioningImage) return;
        e.stopPropagation();

        const startPos = { x: e.clientX, y: e.clientY };
        const startOffset = { x: element.props.shapeImageOffsetX || 0, y: element.props.shapeImageOffsetY || 0 };

        const handleMouseMove = (moveEvent: MouseEvent) => {
            updateElementProps(element.id, {
                shapeImageOffsetX: startOffset.x + (moveEvent.clientX - startPos.x),
                shapeImageOffsetY: startOffset.y + (moveEvent.clientY - startPos.y),
            });
        };

        const handleMouseUp = () => {
            setIsRepositioningImage(false);
            commitHistory();
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const shapeStyles: React.CSSProperties = {
        width: '100%', height: '100%',
        backgroundColor: element.props.shapeImage ? 'transparent' : (element.props.backgroundColor || '#cccccc'),
        opacity: element.props.fillOpacity ?? 1,
        borderRadius: getBorderRadius(),
        clipPath: element.props.clipPath,
        border: element.props.borderWidth ? `${element.props.borderWidth}px ${element.props.borderStyle || 'solid'} ${element.props.borderColor || '#000'}` : 'none',
        boxShadow: getShadow(),
        filter: getFilter(),
        boxSizing: 'border-box',
        overflow: 'hidden',
        position: 'relative',
    };

    return (
        <ElementWrapper element={element} isSelected={isSelected} minWidth={20} minHeight={20} borderColor="#10b981">
            <input type="file" accept="image/*" ref={imageInputRef} className="hidden" onChange={handleImageUpload} />

            {isTriangle ? (
                <div style={{ width: 0, height: 0, borderBottom: element.props.borderBottom, borderLeft: element.props.borderLeft, borderRight: element.props.borderRight, opacity: element.props.fillOpacity ?? 1, filter: getFilter() }} />
            ) : (
                <div style={shapeStyles}>
                    {element.props.shapeImage && (
                        <div
                            style={{ position: 'absolute', inset: 0, cursor: isRepositioningImage ? 'move' : 'default', overflow: 'hidden' }}
                            onDoubleClick={handleImageDoubleClick}
                            onMouseDown={isRepositioningImage ? handleImageReposition : undefined}
                        >
                            <img
                                src={element.props.shapeImage}
                                alt=""
                                style={{
                                    width: `${(element.props.shapeImageScale || 1) * 100}%`,
                                    height: `${(element.props.shapeImageScale || 1) * 100}%`,
                                    objectFit: element.props.shapeImageFit || 'cover',
                                    transform: `translate(${element.props.shapeImageOffsetX || 0}px, ${element.props.shapeImageOffsetY || 0}px)`,
                                    pointerEvents: 'none',
                                }}
                                draggable={false}
                            />
                            {isRepositioningImage && (
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white text-xs pointer-events-none">
                                    Drag to reposition • Click outside to finish
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Add/Replace image button */}
            {isSelected && !isTriangle && (
                <Button
                    variant="secondary" size="sm"
                    className="absolute bottom-1 right-1 h-6 text-xs opacity-80 hover:opacity-100"
                    onClick={() => imageInputRef.current?.click()}
                >
                    <ImagePlus className="h-3 w-3 mr-1" />
                    {element.props.shapeImage ? 'Replace' : 'Add Image'}
                </Button>
            )}
        </ElementWrapper>
    );
};

// Image Element
const ImageElement = ({ element, isSelected }: { element: CanvasElementType; isSelected: boolean }) => {
    const { updateElementProps, commitHistory } = useCanvasStore();
    const imageInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                updateElementProps(element.id, { src: event.target?.result as string });
                commitHistory();
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <ElementWrapper element={element} isSelected={isSelected} minWidth={20} minHeight={20}>
            <input type="file" accept="image/*" ref={imageInputRef} className="hidden" onChange={handleImageUpload} />
            <img
                src={element.props.src}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: element.props.objectFit || 'cover', pointerEvents: 'none', borderRadius: element.props.borderRadius }}
                draggable={false}
            />
            {isSelected && element.props.isTemplateField && (
                <Button variant="secondary" size="sm" className="absolute bottom-1 right-1 h-6 text-xs" onClick={() => imageInputRef.current?.click()}>
                    Replace
                </Button>
            )}
        </ElementWrapper>
    );
};

// Canvas Element Renderer
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

// Ruler Guide with larger hit area
const RulerGuide = ({ id, orientation, position }: { id: string; orientation: 'horizontal' | 'vertical'; position: number }) => {
    const { updateGuide, deleteGuide, commitHistory, zoom } = useCanvasStore();
    const hitAreaSize = 12;

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
            if (finalPos < 34) deleteGuide(id);
            commitHistory();
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const lineStyle: React.CSSProperties = orientation === 'horizontal'
        ? { top: position, left: 0, width: '100%', height: '1px' }
        : { left: position, top: 0, height: '100%', width: '1px' };

    const hitStyle: React.CSSProperties = orientation === 'horizontal'
        ? { top: position - hitAreaSize / 2, left: 0, width: '100%', height: `${hitAreaSize}px`, cursor: 'ns-resize' }
        : { left: position - hitAreaSize / 2, top: 0, height: '100%', width: `${hitAreaSize}px`, cursor: 'ew-resize' };

    return (
        <>
            <div style={{ ...lineStyle, position: 'absolute', backgroundColor: '#60a5fa', zIndex: 20, pointerEvents: 'none' }} />
            <div style={{ ...hitStyle, position: 'absolute', backgroundColor: 'transparent', zIndex: 21 }} onMouseDown={handleMouseDown} />
        </>
    );
};

// Ruler
const Ruler = ({ orientation, zoom, canvasPosition }: { orientation: 'horizontal' | 'vertical'; zoom: number; canvasPosition: { x: number; y: number } }) => {
    const rulerRef = useRef<HTMLDivElement>(null);
    const [ticks, setTicks] = useState<number[]>([]);

    useEffect(() => {
        if (!rulerRef.current) return;
        const size = orientation === 'horizontal' ? rulerRef.current.offsetWidth : rulerRef.current.offsetHeight;
        const intervals = [1, 2, 5, 10, 25, 50, 100, 200, 500, 1000];
        let interval = intervals.find(i => i * zoom > 40) || 1000;
        const offset = orientation === 'horizontal' ? canvasPosition.x : canvasPosition.y;
        const startValue = -Math.round(offset / zoom);
        const firstTick = Math.floor(startValue / interval) * interval;
        const lastTick = startValue + Math.ceil(size / zoom);
        const newTicks = [];
        for (let i = firstTick; i < lastTick; i += interval) newTicks.push(i);
        setTicks(newTicks);
    }, [zoom, canvasPosition, orientation]);

    const getPos = (tick: number) => tick * zoom + (orientation === 'horizontal' ? canvasPosition.x : canvasPosition.y);

    return (
        <div ref={rulerRef} className="absolute inset-0 overflow-hidden">
            {ticks.map(tick => (
                <div key={tick} className="absolute" style={orientation === 'horizontal' ? { top: 0, left: getPos(tick), height: '100%' } : { left: 0, top: getPos(tick), width: '100%' }}>
                    {orientation === 'horizontal' ? (
                        <><div className="w-px h-1.5 bg-gray-500" /><span className="absolute top-2 -translate-x-1/2 text-gray-400 text-xs">{tick}</span></>
                    ) : (
                        <><div className="h-px w-1.5 bg-gray-500 ml-auto" /><span className="absolute left-1 -translate-y-1/2 text-gray-400 text-xs" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>{tick}</span></>
                    )}
                </div>
            ))}
        </div>
    );
};

// Page Background with repositioning
const PageBackground = () => {
    const { pageDetails, updatePageBackground, commitHistory, isBackgroundRepositioning, setBackgroundRepositioning } = useCanvasStore();
    const bg = pageDetails.background;

    if (!bg.image) return null;

    const getFilter = () => {
        const f = [];
        if (bg.blur > 0) f.push(`blur(${bg.blur}px)`);
        if (bg.grayscale > 0) f.push(`grayscale(${bg.grayscale}%)`);
        if (bg.brightness !== 100) f.push(`brightness(${bg.brightness}%)`);
        if (bg.contrast !== 100) f.push(`contrast(${bg.contrast}%)`);
        if (bg.saturate !== 100) f.push(`saturate(${bg.saturate}%)`);
        return f.length ? f.join(' ') : 'none';
    };

    const handleDoubleClick = (e: React.MouseEvent) => { e.stopPropagation(); setBackgroundRepositioning(true); };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!isBackgroundRepositioning) return;
        e.stopPropagation();
        const startPos = { x: e.clientX, y: e.clientY };
        const startOffset = { x: bg.offsetX, y: bg.offsetY };

        const handleMouseMove = (moveEvent: MouseEvent) => {
            updatePageBackground({ offsetX: startOffset.x + (moveEvent.clientX - startPos.x), offsetY: startOffset.y + (moveEvent.clientY - startPos.y) });
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
            style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0, cursor: isBackgroundRepositioning ? 'move' : 'default' }}
            onDoubleClick={handleDoubleClick}
            onMouseDown={handleMouseDown}
        >
            <img
                src={bg.image}
                alt="background"
                style={{
                    width: bg.objectFit === 'none' ? 'auto' : '100%',
                    height: bg.objectFit === 'none' ? 'auto' : '100%',
                    minWidth: '100%', minHeight: '100%',
                    objectFit: bg.objectFit, objectPosition: bg.objectPosition,
                    opacity: bg.opacity, filter: getFilter(),
                    transform: `translate(${bg.offsetX}px, ${bg.offsetY}px) scale(${bg.scale})`,
                    transformOrigin: 'center', pointerEvents: 'none',
                }}
                draggable={false}
            />
            {isBackgroundRepositioning && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                    <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
                        Drag to reposition • Scroll to scale • Click outside to finish
                    </div>
                </div>
            )}
        </div>
    );
};

// Main Canvas Component
const Canvas = ({ onPageDoubleClick }: { onPageDoubleClick: () => void }) => {
    const {
        elements, addElement, selectElement, deleteElement, selectedElementId,
        zoom, setZoom, canvasPosition, setCanvasPosition, rulers, guides, addGuide,
        pageDetails, updatePageBackground, commitHistory, undo, redo, historyIndex, history,
        isBackgroundRepositioning, setBackgroundRepositioning,
    } = useCanvasStore();

    const mainCanvasRef = useRef<HTMLDivElement>(null);
    const pageRef = useRef<HTMLDivElement>(null);
    const dragStart = useRef({ x: 0, y: 0, canvasX: 0, canvasY: 0 });

    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;

    // Load fonts
    useEffect(() => { loadGoogleFonts(); }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) { e.preventDefault(); deleteElement(selectedElementId); }
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
            if (e.key === 'Escape' && isBackgroundRepositioning) setBackgroundRepositioning(false);
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [selectedElementId, isBackgroundRepositioning]);

    const handleCanvasPan = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target !== mainCanvasRef.current && e.target !== pageRef.current) return;
        if (isBackgroundRepositioning) { setBackgroundRepositioning(false); return; }

        e.preventDefault();
        dragStart.current = { x: e.clientX, y: e.clientY, canvasX: canvasPosition.x, canvasY: canvasPosition.y };

        const handleMouseMove = (moveEvent: MouseEvent) => {
            setCanvasPosition({ x: dragStart.current.canvasX + (moveEvent.clientX - dragStart.current.x), y: dragStart.current.canvasY + (moveEvent.clientY - dragStart.current.y) });
        };
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

        const handleMouseMove = (moveEvent: MouseEvent) => {
            tempGuide.style[orientation === 'horizontal' ? 'top' : 'left'] = `${orientation === 'horizontal' ? moveEvent.clientY : moveEvent.clientX}px`;
        };

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

        // Scale background when repositioning
        if (isBackgroundRepositioning) {
            const newScale = Math.max(0.5, Math.min(3, (pageDetails.background.scale || 1) * (e.deltaY > 0 ? 0.95 : 1.05)));
            updatePageBackground({ scale: newScale });
            return;
        }

        const rect = mainCanvasRef.current!.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (e.ctrlKey || e.metaKey || e.altKey) {
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

    const resetView = () => {
        if (!mainCanvasRef.current || !pageRef.current) return;
        const canvasRect = mainCanvasRef.current.getBoundingClientRect();
        setCanvasPosition({ x: (canvasRect.width - pageRef.current.offsetWidth) / 2, y: (canvasRect.height - pageRef.current.offsetHeight) / 2 });
        setZoom(1);
    };

    useEffect(() => { const t = setTimeout(resetView, 100); return () => clearTimeout(t); }, []);

    const handleCanvasClick = (e: React.MouseEvent) => {
        if (e.target === mainCanvasRef.current || e.target === pageRef.current) selectElement(null);
    };

    const sortedElements = [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    return (
        <main
            ref={mainCanvasRef}
            className="flex-1 bg-gray-200 overflow-hidden relative cursor-grab active:cursor-grabbing"
            onMouseDown={handleCanvasPan}
            onClick={handleCanvasClick}
            onDoubleClick={(e) => { if (e.target === mainCanvasRef.current || e.target === pageRef.current) onPageDoubleClick(); }}
            onWheel={handleWheel}
            onContextMenu={(e) => e.preventDefault()}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
            onDrop={handleDrop}
        >
            <TextMeasure />

            {rulers.visible && (
                <>
                    <div className="absolute top-0 left-6 h-6 w-[calc(100%-1.5rem)] bg-gray-800 z-30 cursor-crosshair" onMouseDown={(e) => handleRulerDrag('horizontal', e)}>
                        <Ruler orientation="horizontal" zoom={zoom} canvasPosition={{ x: canvasPosition.x, y: 0 }} />
                    </div>
                    <div className="absolute left-0 top-6 w-6 h-[calc(100%-1.5rem)] bg-gray-800 z-30 cursor-crosshair" onMouseDown={(e) => handleRulerDrag('vertical', e)}>
                        <Ruler orientation="vertical" zoom={zoom} canvasPosition={{ y: canvasPosition.y, x: 0 }} />
                    </div>
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

                <div className="absolute left-1/2 -translate-x-1/2 z-30" style={{ top: `calc(${pageDetails.height}${pageDetails.unit} + 16px)` }}>
                    <Button variant="outline" className="bg-white shadow-md"><PlusSquare className="mr-2 h-4 w-4" /> Add page</Button>
                </div>
            </div>
        </main>
    );
};

export default Canvas;