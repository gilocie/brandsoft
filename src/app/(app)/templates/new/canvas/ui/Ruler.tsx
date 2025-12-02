'use client';

import React, { useRef, useEffect, useState } from 'react';

interface RulerProps {
    orientation: 'horizontal' | 'vertical';
    zoom: number;
    canvasPosition: { x: number; y: number };
}

export const Ruler = ({ orientation, zoom, canvasPosition }: RulerProps) => {
    const rulerRef = useRef<HTMLDivElement>(null);
    const [ticks, setTicks] = useState<number[]>([]);

    useEffect(() => {
        if (!rulerRef.current) return;
        const size = orientation === 'horizontal' ? rulerRef.current.offsetWidth : rulerRef.current.offsetHeight;
        const intervals = [1, 2, 5, 10, 25, 50, 100, 200, 500, 1000];
        const interval = intervals.find(i => i * zoom > 40) || 1000;
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
