'use client';

import React, { useRef, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCanvasStore, type CanvasElement } from '@/stores/canvas-store';
import { ElementWrapper } from './ElementWrapper';

interface ShapeElementProps { element: CanvasElement; isSelected: boolean; }

export const ShapeElement = ({ element, isSelected }: ShapeElementProps) => {
    const { updateElementProps, commitHistory } = useCanvasStore();
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
            reader.onload = (event) => { updateElementProps(element.id, { shapeImage: event.target?.result as string, shapeImageScale: 1, shapeImageOffsetX: 0, shapeImageOffsetY: 0 }); commitHistory(); };
            reader.readAsDataURL(file);
        }
    };

    const handleImageDoubleClick = (e: React.MouseEvent) => { e.stopPropagation(); setIsRepositioningImage(true); };

    const handleImageReposition = (e: React.MouseEvent) => {
        if (!isRepositioningImage) return;
        e.stopPropagation();
        const startPos = { x: e.clientX, y: e.clientY };
        const startOffset = { x: element.props.shapeImageOffsetX || 0, y: element.props.shapeImageOffsetY || 0 };

        const handleMouseMove = (moveEvent: MouseEvent) => { updateElementProps(element.id, { shapeImageOffsetX: startOffset.x + (moveEvent.clientX - startPos.x), shapeImageOffsetY: startOffset.y + (moveEvent.clientY - startPos.y) }); };
        const handleMouseUp = () => { setIsRepositioningImage(false); commitHistory(); document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const shapeStyles: React.CSSProperties = {
        width: '100%', height: '100%',
        backgroundColor: element.props.shapeImage ? 'transparent' : (element.props.backgroundColor || '#cccccc'),
        opacity: element.props.fillOpacity ?? 1, borderRadius: getBorderRadius(), clipPath: element.props.clipPath,
        border: element.props.borderWidth ? `${element.props.borderWidth}px ${element.props.borderStyle || 'solid'} ${element.props.borderColor || '#000'}` : 'none',
        boxShadow: getShadow(), filter: getFilter(), boxSizing: 'border-box', overflow: 'hidden', position: 'relative',
    };

    return (
        <ElementWrapper element={element} isSelected={isSelected} minWidth={20} minHeight={20} borderColor="#10b981">
            <input type="file" accept="image/*" ref={imageInputRef} className="hidden" onChange={handleImageUpload} />
            {isTriangle ? (
                <div style={{ width: 0, height: 0, borderBottom: element.props.borderBottom, borderLeft: element.props.borderLeft, borderRight: element.props.borderRight, opacity: element.props.fillOpacity ?? 1, filter: getFilter() }} />
            ) : (
                <div style={shapeStyles}>
                    {element.props.shapeImage && (
                        <div style={{ position: 'absolute', inset: 0, cursor: isRepositioningImage ? 'move' : 'default', overflow: 'hidden' }} onDoubleClick={handleImageDoubleClick} onMouseDown={isRepositioningImage ? handleImageReposition : undefined}>
                            <img src={element.props.shapeImage} alt="" style={{ width: `${(element.props.shapeImageScale || 1) * 100}%`, height: `${(element.props.shapeImageScale || 1) * 100}%`, objectFit: element.props.shapeImageFit || 'cover', transform: `translate(${element.props.shapeImageOffsetX || 0}px, ${element.props.shapeImageOffsetY || 0}px)`, pointerEvents: 'none' }} draggable={false} />
                            {isRepositioningImage && <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white text-xs pointer-events-none">Drag to reposition • Click outside to finish</div>}
                        </div>
                    )}
                </div>
            )}
            {isSelected && !isTriangle && (
                <Button variant="secondary" size="sm" className="absolute bottom-1 right-1 h-6 text-xs opacity-80 hover:opacity-100" onClick={() => imageInputRef.current?.click()}>
                    <ImagePlus className="h-3 w-3 mr-1" />{element.props.shapeImage ? 'Replace' : 'Add Image'}
                </Button>
            )}
        </ElementWrapper>
    );
};
