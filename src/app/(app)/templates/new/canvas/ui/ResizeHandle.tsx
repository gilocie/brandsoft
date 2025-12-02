'use client';

import React, { useState, useRef } from 'react';
import { getRotationCursor, getResizeCursor } from '../utils';

interface ResizeHandleProps {
    position: string;
    onMouseDown: (e: React.MouseEvent) => void;
    onRotateStart?: (e: React.MouseEvent) => void;
}

export const ResizeHandle = ({ position, onMouseDown, onRotateStart }: ResizeHandleProps) => {
    const [isRotationZone, setIsRotationZone] = useState(false);
    const handleRef = useRef<HTMLDivElement>(null);

    const positionStyles: Record<string, React.CSSProperties> = {
        'top-left': { top: '-6px', left: '-6px' },
        'top-center': { top: '-6px', left: '50%', transform: 'translateX(-50%)' },
        'top-right': { top: '-6px', right: '-6px' },
        'middle-left': { top: '50%', left: '-6px', transform: 'translateY(-50%)' },
        'middle-right': { top: '50%', right: '-6px', transform: 'translateY(-50%)' },
        'bottom-left': { bottom: '-6px', left: '-6px' },
        'bottom-center': { bottom: '-6px', left: '50%', transform: 'translateX(-50%)' },
        'bottom-right': { bottom: '-6px', right: '-6px' },
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
            style={{
                position: 'absolute',
                width: '12px',
                height: '12px',
                backgroundColor: 'white',
                border: '2px solid #3b82f6',
                borderRadius: '50%',
                zIndex: 10,
                cursor: isRotationZone ? getRotationCursor() : getResizeCursor(position),
                ...positionStyles[position],
            }}
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
