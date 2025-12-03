
'use client';

import React, { useRef, useState } from 'react';
import { type GradientStop } from '@/stores/canvas-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ColorInput } from '../../components/ColorInput';

export const GradientSlider = ({ stops, onStopsChange, onCommit }: { stops: GradientStop[], onStopsChange: (stops: GradientStop[]) => void, onCommit: () => void }) => {
    const sliderRef = useRef<HTMLDivElement>(null);
    const [selectedStopIndex, setSelectedStopIndex] = useState<number | null>(0);

    const sortedStops = [...stops].sort((a, b) => a.position - b.position);
    const background = `linear-gradient(to right, ${sortedStops.map(s => `${s.color} ${s.position}%`).join(', ')})`;

    const handleSliderClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!sliderRef.current || (e.target as HTMLElement).dataset.handle) return;
        
        const rect = sliderRef.current.getBoundingClientRect();
        const position = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        
        // Add new stop
        const newStops = [...sortedStops, { color: '#ffffff', position: Math.round(position) }];
        onStopsChange(newStops);
        setSelectedStopIndex(newStops.length - 1);
        onCommit();
    };

    const handleStopDrag = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        setSelectedStopIndex(index);
        
        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!sliderRef.current) return;
            const rect = sliderRef.current.getBoundingClientRect();
            const newPosition = Math.max(0, Math.min(100, ((moveEvent.clientX - rect.left) / rect.width) * 100));
            
            const newStops = [...sortedStops];
            newStops[index].position = newPosition;
            onStopsChange(newStops);
        };

        const handleMouseUp = () => {
            onCommit();
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleStopColorChange = (color: string) => {
        if (selectedStopIndex === null) return;
        const newStops = [...sortedStops];
        newStops[selectedStopIndex].color = color;
        onStopsChange(newStops);
    };

    const handleRemoveStop = () => {
        if (selectedStopIndex === null || sortedStops.length <= 2) return;
        const newStops = sortedStops.filter((_, i) => i !== selectedStopIndex);
        onStopsChange(newStops);
        setSelectedStopIndex(Math.max(0, selectedStopIndex - 1));
        onCommit();
    };
    
    const handlePositionInput = (pos: number) => {
         if (selectedStopIndex === null) return;
         const newStops = [...sortedStops];
         newStops[selectedStopIndex].position = Math.max(0, Math.min(100, pos));
         onStopsChange(newStops);
    };

    const selectedStop = selectedStopIndex !== null ? sortedStops[selectedStopIndex] : null;

    return (
        <div className="space-y-3">
            <div ref={sliderRef} onClick={handleSliderClick} className="relative h-6 w-full rounded-full border cursor-pointer" style={{ background }}>
                {sortedStops.map((stop, index) => (
                    <div
                        key={index}
                        data-handle="true"
                        onMouseDown={(e) => handleStopDrag(e, index)}
                        className={cn(
                            "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 bg-white cursor-ew-resize",
                            selectedStopIndex === index ? "border-primary ring-2 ring-primary z-10" : "border-gray-400"
                        )}
                        style={{ left: `${stop.position}%` }}
                    />
                ))}
            </div>
            {selectedStop && (
                <div className="p-3 bg-muted rounded-md space-y-3">
                     <div className="flex items-center gap-2">
                        <ColorInput label="" value={selectedStop.color} onChange={handleStopColorChange} onBlur={onCommit} />
                        <Input
                            type="number"
                            value={Math.round(selectedStop.position)}
                            onChange={(e) => handlePositionInput(Number(e.target.value))}
                            onBlur={onCommit}
                            className="w-16 h-8 text-xs text-right"
                            min={0} max={100} step={1}
                        />
                         <Button variant="destructive" size="icon" className="h-8 w-8" onClick={handleRemoveStop} disabled={sortedStops.length <= 2}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
