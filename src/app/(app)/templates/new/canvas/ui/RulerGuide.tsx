'use client';

import React from 'react';
import { useCanvasStore } from '@/stores/canvas-store';

interface RulerGuideProps {
    id: string;
    orientation: 'horizontal' | 'vertical';
    position: number;
}

export const RulerGuide = ({ id, orientation, position }: RulerGuideProps) => {
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
