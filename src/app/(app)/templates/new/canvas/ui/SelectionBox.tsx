'use client';

import React from 'react';

interface SelectionBoxProps {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
}

export const SelectionBox = ({ startX, startY, endX, endY }: SelectionBoxProps) => {
    const left = Math.min(startX, endX);
    const top = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);

    return (
        <div
            style={{
                position: 'absolute',
                left,
                top,
                width,
                height,
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                border: '1px dashed #3b82f6',
                pointerEvents: 'none',
                zIndex: 9999,
            }}
        />
    );
};
