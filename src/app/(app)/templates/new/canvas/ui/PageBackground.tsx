'use client';

import React from 'react';
import { useCanvasStore } from '@/stores/canvas-store';

export const PageBackground = () => {
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
                src={bg.image} alt="background" draggable={false}
                style={{
                    width: bg.objectFit === 'none' ? 'auto' : '100%',
                    height: bg.objectFit === 'none' ? 'auto' : '100%',
                    minWidth: '100%', minHeight: '100%',
                    objectFit: bg.objectFit, objectPosition: bg.objectPosition,
                    opacity: bg.opacity, filter: getFilter(),
                    transform: `translate(${bg.offsetX}px, ${bg.offsetY}px) scale(${bg.scale})`,
                    transformOrigin: 'center', pointerEvents: 'none',
                }}
            />
            {isBackgroundRepositioning && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none">
                    <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm">Drag to reposition • Scroll to scale • Click outside to finish</div>
                </div>
            )}
        </div>
    );
};
