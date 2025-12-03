
'use client';

import React, { useState, useRef } from 'react';
import { Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCanvasStore, type CanvasElement } from '@/stores/canvas-store';
import { ResizeHandle, RotationHandle, SnapLines, LinkIndicator } from '../ui';

interface ElementWrapperProps {
    element: CanvasElement;
    isSelected: boolean;
    children: React.ReactNode;
    minWidth?: number;
    minHeight?: number;
    onCalculateMinSize?: () => { minWidth: number; minHeight: number };
    borderColor?: string;
    borderStyle?: 'solid' | 'dashed';
}

export const ElementWrapper = ({
    element, isSelected, children, minWidth = 20, minHeight = 20,
    onCalculateMinSize, borderColor = '#3b82f6', borderStyle = 'solid',
}: ElementWrapperProps) => {
    const { 
        updateElement, selectElement, commitHistory, zoom, linkElements, unlinkElement, getSnapPosition, 
        pages, currentPageIndex, isTemplateEditMode 
    } = useCanvasStore();

    const currentPage = pages[currentPageIndex];
    const elements = currentPage?.elements || [];

    const elementRef = useRef<HTMLDivElement>(null);
    const [snapInfo, setSnapInfo] = useState<{ vertical: number | null; horizontal: number | null }>({ vertical: null, horizontal: null });
    const [showLinkButton, setShowLinkButton] = useState<string | null>(null);

    const isLinked = !!element.linkedElementId;
    const isEditable = !isTemplateEditMode || element.props.isTemplateField;

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
            const snapped = getSnapPosition(element, startElementPos.x + dx, startElementPos.y + dy);
            updateElement(element.id, { x: snapped.x, y: snapped.y });

            if (snapped.snappedToId) {
                const other = elements.find(el => el.id === snapped.snappedToId);
                if (other) {
                    setSnapInfo({ vertical: snapped.x !== startElementPos.x + dx ? snapped.x + element.width / 2 : null, horizontal: snapped.y !== startElementPos.y + dy ? snapped.y + element.height / 2 : null });
                    if (element.type === 'text' && other.type === 'shape') setShowLinkButton(other.id);
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

    const handleRotateStart = (e: React.MouseEvent) => {
        if (!elementRef.current) return;
        e.stopPropagation();
        e.preventDefault();
        const rect = elementRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2, centerY = rect.top + rect.height / 2;
        const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        const startRotation = element.rotation;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const currentAngle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX);
            let angleDiff = (currentAngle - startAngle) * (180 / Math.PI);
            if (moveEvent.shiftKey) angleDiff = Math.round(angleDiff / 15) * 15;
            updateElement(element.id, { rotation: startRotation + angleDiff });
        };

        const handleMouseUp = () => { commitHistory(); document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleResize = (e: React.MouseEvent, handle: string) => {
        e.stopPropagation();
        e.preventDefault();
        const startPos = { x: e.clientX, y: e.clientY };
        const original = { x: element.x, y: element.y, width: element.width, height: element.height };

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const dx = (moveEvent.clientX - startPos.x) / zoom, dy = (moveEvent.clientY - startPos.y) / zoom;
            let { x: newX, y: newY, width: newWidth, height: newHeight } = original;
            const mins = onCalculateMinSize ? onCalculateMinSize() : { minWidth, minHeight };

            if (handle.includes('right')) newWidth = Math.max(mins.minWidth, original.width + dx);
            if (handle.includes('left')) { const proposed = original.width - dx; if (proposed >= mins.minWidth) { newWidth = proposed; newX = original.x + dx; } else { newWidth = mins.minWidth; newX = original.x + original.width - mins.minWidth; } }
            if (handle.includes('bottom')) newHeight = Math.max(mins.minHeight, original.height + dy);
            if (handle.includes('top')) { const proposed = original.height - dy; if (proposed >= mins.minHeight) { newHeight = proposed; newY = original.y + dy; } else { newHeight = mins.minHeight; newY = original.y + original.height - mins.minHeight; } }

            updateElement(element.id, { x: newX, y: newY, width: newWidth, height: newHeight });
        };

        const handleMouseUp = () => { commitHistory(); document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleLink = () => { if (showLinkButton) { linkElements(showLinkButton, element.id); setShowLinkButton(null); } };

    const handlePositions = ['top-left', 'top-center', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right'];

    return (
        <>
            <div ref={elementRef} onMouseDown={handleMouseDown} style={{ position: 'absolute', left: element.x, top: element.y, width: element.width, height: element.height, transform: `rotate(${element.rotation}deg)`, transformOrigin: 'center center', cursor: isEditable ? 'move' : 'default', zIndex: element.zIndex || 1, opacity: element.props.opacity ?? 1 }}>
                {children}
                {element.props.isTemplateField && <div className="absolute -top-5 left-0 bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none">{element.props.templateFieldName || element.props.templateFieldType}</div>}
                {showLinkButton && isSelected && <div className="absolute -top-8 right-0 z-50"><Button variant="secondary" size="sm" className="h-6 text-xs shadow-md" onClick={handleLink}><Link className="h-3 w-3 mr-1" /> Link</Button></div>}
                {isSelected && isEditable && (
                    <>
                        <div style={{ position: 'absolute', inset: -1, border: `2px ${borderStyle} ${borderColor}`, pointerEvents: 'none' }} />
                        <RotationHandle onRotateStart={handleRotateStart} />
                        {isLinked && <LinkIndicator onUnlink={() => unlinkElement(element.id)} />}
                        <div data-handle="true">
                            {handlePositions.map(pos => <ResizeHandle key={pos} position={pos} onMouseDown={(e) => handleResize(e, pos)} onRotateStart={handleRotateStart} />)}
                        </div>
                    </>
                )}
            </div>
            <SnapLines snapInfo={snapInfo} />
        </>
    );
};
