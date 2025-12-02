'use client';

import React from 'react';

interface SnapLinesProps {
    snapInfo: { vertical: number | null; horizontal: number | null };
}

export const SnapLines = ({ snapInfo }: SnapLinesProps) => {
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
