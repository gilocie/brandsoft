
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { create } from 'zustand';
import {
  ChevronLeft,
  File,
  RefreshCcw,
  RefreshCw,
  UploadCloud,
  Share,
  LayoutTemplate,
  Shapes,
  Type,
  Image as ImageIcon,
  Palette,
  MoreHorizontal,
  Plus,
  Copy,
  Trash2,
  Maximize,
  Minus,
  Move,
  RotateCw
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBrandsoft } from '@/hooks/use-brandsoft';
import { cn } from '@/lib/utils';

// Main state management store for the canvas using Zustand
const useCanvasStore = create((set, get) => ({
  elements: [],
  selectedElementId: null,
  history: [[]],
  historyIndex: 0,
  zoom: 1,

  addElement: (element) => {
    const newElement = { ...element, id: Date.now().toString() };
    set((state) => ({
      elements: [...state.elements, newElement],
    }));
    get().commitHistory();
  },

  updateElement: (id, updates) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ),
    }));
  },

  deleteElement: (id) => {
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
    }));
    get().commitHistory();
  },

  selectElement: (id) => set({ selectedElementId: id }),
  
  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(3, zoom)) }),

  commitHistory: () => {
    set(state => {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(state.elements);
      return {
        history: newHistory,
        historyIndex: newHistory.length - 1
      };
    });
  },

  undo: () => {
    set(state => {
      if (state.historyIndex > 0) {
        const newIndex = state.historyIndex - 1;
        return {
          elements: state.history[newIndex],
          historyIndex: newIndex,
          selectedElementId: null
        };
      }
      return {};
    });
  },

  redo: () => {
    set(state => {
      if (state.historyIndex < state.history.length - 1) {
        const newIndex = state.historyIndex + 1;
        return {
          elements: state.history[newIndex],
          historyIndex: newIndex,
          selectedElementId: null
        };
      }
      return {};
    });
  },
}));


// --- Sub-Components for the Design Studio ---

const Header = () => {
    const { undo, redo, historyIndex, history } = useCanvasStore();
    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;
    const { config } = useBrandsoft();

    return (
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 z-20">
             <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/templates"><ChevronLeft className="mr-2 h-4 w-4" /> Home</Link>
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Button variant="ghost" size="sm"><File className="mr-2 h-4 w-4" /> File</Button>
                <Button variant="ghost" size="sm">Resize</Button>
            </div>
            <div className="flex-1 text-center text-sm text-gray-500">
                <button>Untitled design</button>
            </div>
            <div className="flex items-center gap-2">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo}><RefreshCcw /></Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Undo (Ctrl+Z)</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo}><RefreshCw /></Button>
                        </TooltipTrigger>
                         <TooltipContent><p>Redo (Ctrl+Y)</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <Separator orientation="vertical" className="h-6" />
                <span className="text-xs text-gray-400 flex items-center gap-1.5"><UploadCloud className="h-4 w-4" /> All changes saved</span>
                 <Button><Share className="mr-2 h-4 w-4" /> Share</Button>
                 <Avatar className="h-9 w-9">
                    <AvatarImage src={config?.brand.logo} />
                    <AvatarFallback>{config?.brand.businessName?.[0]}</AvatarFallback>
                </Avatar>
            </div>
        </header>
    );
}

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
        <aside className="w-20 bg-[#18191a] flex flex-col items-center py-4 space-y-1 z-10">
            {tools.map(tool => (
                <TooltipProvider key={tool.label}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" className="w-16 h-16 flex-col text-white hover:bg-gray-700 hover:text-white" onClick={tool.action}>
                                <tool.icon className="h-6 w-6" />
                                <span className="text-xs mt-1">{tool.label}</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right"><p>{tool.label}</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ))}
        </aside>
    );
};

const CanvasElement = ({ element }) => {
    const { updateElement, selectElement, commitHistory, selectedElementId } = useCanvasStore();
    const isSelected = selectedElementId === element.id;

    const dragStartPos = useRef({ x: 0, y: 0 });

    const handleDragStart = (e) => {
        e.stopPropagation();
        selectElement(element.id);
        dragStartPos.current = { x: e.clientX, y: e.clientY };

        const handleMouseMove = (moveEvent) => {
            const dx = moveEvent.clientX - dragStartPos.current.x;
            const dy = moveEvent.clientY - dragStartPos.current.y;
            dragStartPos.current = { x: moveEvent.clientX, y: moveEvent.clientY };
            updateElement(element.id, { x: element.x + dx, y: element.y + dy });
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
            onMouseDown={handleDragStart}
            style={{
                position: 'absolute',
                left: element.x,
                top: element.y,
                width: element.width,
                height: element.height,
                transform: `rotate(${element.rotation}deg)`,
                cursor: 'grab'
            }}
            className={cn(isSelected && 'outline outline-2 outline-blue-500 outline-offset-2')}
        >
            {element.type === 'text' && <p style={{ ...element.props, width: '100%', height: '100%' }}>{element.props.text}</p>}
            {element.type === 'image' && <img src={element.props.src} alt="canvas element" className="w-full h-full object-cover" />}
            {element.type === 'shape' && <div className="w-full h-full" style={{...element.props}}/>}
        </div>
    );
};


const Canvas = () => {
    const { elements, selectElement, zoom } = useCanvasStore();

    return (
        <main className="flex-1 bg-gray-200 flex items-center justify-center p-8 overflow-auto">
             <div 
                className="relative bg-white shadow-lg"
                style={{ 
                    width: '8.5in', 
                    height: '11in',
                    transform: `scale(${zoom})`,
                    transformOrigin: 'center center'
                }}
                onClick={() => selectElement(null)}
            >
                {elements.map(el => (
                    <CanvasElement key={el.id} element={el} />
                ))}

                 {elements.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
                        <div className="text-center">
                            <p>Click an element from the left panel to add it</p>
                        </div>
                    </div>
                )}
                
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                    <Button variant="outline" className="bg-white"><Plus className="mr-2 h-4 w-4" /> Add page</Button>
                </div>
                
            </div>
        </main>
    );
};


const Footer = () => {
    const { zoom, setZoom } = useCanvasStore();

    return (
        <footer className="h-10 bg-white border-t flex items-center justify-end px-4 z-20">
             <div className="flex items-center gap-2">
                 <Button variant="ghost" size="icon" onClick={() => setZoom(zoom - 0.1)}><Minus /></Button>
                 <Slider value={[zoom * 100]} onValueChange={(val) => setZoom(val[0] / 100)} max={200} step={1} className="w-24" />
                 <Button variant="ghost" size="icon" onClick={() => setZoom(zoom + 0.1)}><Maximize /></Button>
                 <span className="text-sm font-medium w-12 text-center">{Math.round(zoom * 100)}%</span>
            </div>
        </footer>
    )
}

export default function DesignStudioPage() {
    return (
        <div className="flex flex-col h-screen w-screen bg-white text-gray-900">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                <LeftSidebar />
                <div className="flex flex-1 flex-col">
                    <Canvas />
                    <Footer />
                </div>
                {/* No right properties panel in this layout to match the image */}
            </div>
        </div>
    );
}

