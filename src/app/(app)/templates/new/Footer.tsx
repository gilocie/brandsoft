
'use client';

import React from 'react';
import { Slider } from '@/components/ui/slider';
import {
  Plus,
  Minus,
  Maximize,
} from 'lucide-react';
import { useCanvasStore } from '@/stores/canvas-store';

const Footer = () => {
    const { zoom, setZoom } = useCanvasStore();

    const handleZoomChange = (value: number[]) => {
        setZoom(value[0] / 100);
    }
    
    return (
        <footer className="h-12 bg-black flex items-center justify-end px-4 z-20 text-white shrink-0">
             <div className="flex items-center gap-2">
                <Minus className="h-4 w-4" />
                <Slider 
                    value={[zoom * 100]}
                    max={300} 
                    step={10} 
                    className="w-32"
                    onValueChange={handleZoomChange}
                    />
                <Plus className="h-4 w-4" />
                <span className="w-12 text-center">{Math.round(zoom * 100)}%</span>
                <Maximize className="h-5 w-5" />
            </div>
        </footer>
    );
}

export default Footer;
