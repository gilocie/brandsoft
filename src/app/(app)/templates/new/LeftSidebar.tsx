
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

const LeftSidebar = () => {
    const { addElement } = useCanvasStore();

    const handleAddText = () => {
        addElement({
            type: 'text',
            x: 100, y: 100, width: 200, height: 50, rotation: 0,
            props: { text: "Your Text Here", fontSize: 24, color: '#000000', fontFamily: 'Arial' }
        });
    };
    
    const handleAddImage = () => {
         addElement({
            type: 'image',
            x: 150, y: 150, width: 150, height: 100, rotation: 0,
            props: { src: 'https://picsum.photos/seed/placeholder/200/300' }
        });
    }
    
    const handleAddShape = () => {
         addElement({
            type: 'shape',
            x: 200, y: 200, width: 100, height: 100, rotation: 0,
            props: { backgroundColor: '#cccccc' }
        });
    }

    const tools = [
        { icon: LayoutTemplate, label: 'Templates' },
        { icon: Shapes, label: 'Elements', action: handleAddShape },
        { icon: UploadCloud, label: 'Uploads' },
        { icon: Type, label: 'Text', action: handleAddText },
        { icon: ImageIcon, label: 'Images', action: handleAddImage },
        { icon: Palette, label: 'Styles' },
        { icon: MoreHorizontal, label: 'More' },
    ];
    
    return (
        <aside className="w-32 bg-black flex flex-col z-10">
            <ScrollArea className="flex-1">
                 <div className="flex flex-col p-4 space-y-2">
                    {tools.map(tool => (
                        <Button
                            key={tool.label}
                            variant="ghost" 
                            className="w-full h-12 flex justify-start items-center text-white hover:bg-gray-800 hover:text-white px-4" 
                            onClick={tool.action}
                        >
                            <tool.icon className="h-5 w-5 mr-4" />
                            <span className="text-sm">{tool.label}</span>
                        </Button>
                    ))}
                 </div>
            </ScrollArea>
        </aside>
    );
};

export default LeftSidebar;
