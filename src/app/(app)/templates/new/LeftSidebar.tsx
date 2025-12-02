
'use client';

import React from 'react';
import {
  LayoutTemplate,
  Shapes,
  Type,
  ImageIcon,
  Palette,
  MoreHorizontal,
  UploadCloud
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCanvasStore } from '@/stores/canvas-store';
import { cn } from '@/lib/utils';

interface LeftSidebarProps {
    activeTool: string | null;
    setActiveTool: (tool: string | null) => void;
}

const LeftSidebar = ({ activeTool, setActiveTool }: LeftSidebarProps) => {

    const handleToolClick = (label: string) => {
        setActiveTool(prev => prev === label ? null : label);
    }
    
    const tools = [
        { icon: LayoutTemplate, label: 'Templates' },
        { icon: Shapes, label: 'Shapes' },
        { icon: UploadCloud, label: 'Uploads' },
        { icon: Type, label: 'Text & Fields' },
        { icon: ImageIcon, label: 'Images' },
        { icon: Palette, label: 'Styles' },
        { icon: MoreHorizontal, label: 'More' },
    ];
    
    return (
        <aside className="w-24 bg-black flex flex-col z-10">
            <ScrollArea>
                 <div className="flex flex-col items-center p-2 space-y-2">
                    {tools.map(tool => (
                        <Button
                            key={tool.label}
                            variant="ghost" 
                            className={cn(
                                "w-full h-16 flex-col text-white hover:bg-gray-800 hover:text-white",
                                activeTool === tool.label && "bg-primary text-primary-foreground hover:bg-primary/90"
                            )}
                            onClick={() => handleToolClick(tool.label)}
                        >
                            <tool.icon className="h-5 w-5 mb-1" />
                            <span className="text-xs text-center">{tool.label}</span>
                        </Button>
                    ))}
                 </div>
            </ScrollArea>
        </aside>
    );
};

export default LeftSidebar;
