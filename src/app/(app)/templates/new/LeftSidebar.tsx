

'use client';

import React from 'react';
import {
  LayoutTemplate,
  Shapes,
  Braces,
  ImageIcon,
  Palette,
  MoreHorizontal,
  UploadCloud,
  Type,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useCanvasStore } from '@/stores/canvas-store';

interface LeftSidebarProps {
    activeTool: string | null;
    onToolClick: (tool: string) => void;
}

const LeftSidebar = ({ activeTool, onToolClick }: LeftSidebarProps) => {
    const { setActivePanel } = useCanvasStore();

    const tools = [
        { icon: Braces, label: 'Fields' },
        { icon: Type, label: 'Text' },
        { icon: Shapes, label: 'Shapes' },
        { icon: LayoutTemplate, label: 'Templates' },
        { icon: UploadCloud, label: 'Uploads' },
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
                            onClick={() => onToolClick(tool.label)}
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
