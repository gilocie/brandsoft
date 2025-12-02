
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
  ImageIcon,
  Palette,
  MoreHorizontal,
  Plus,
  Minus,
  Maximize,
  Ruler,
  Check
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';


// --- Main State Management (Zustand) ---
const useCanvasStore = create((set, get) => ({
  elements: [],
  selectedElementId: null,
  history: [[]],
  historyIndex: 0,
  zoom: 1,
  canvasPosition: { x: 0, y: 0 },
  rulers: { visible: false },
  guides: { horizontal: [], vertical: [] },

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

  setCanvasPosition: (position) => set({ canvasPosition: position }),
  
  toggleRulers: () => set(state => ({ rulers: { ...state.rulers, visible: !state.rulers.visible } })),

  addGuide: (orientation, position) => {
    set(state => {
      const id = `guide-${orientation}-${Date.now()}`;
      if (orientation === 'horizontal') {
        return { guides: { ...state.guides, horizontal: [...state.guides.horizontal, { id, y: position }]}};
      } else {
        return { guides: { ...state.guides, vertical: [...state.guides.vertical, { id, x: position }]}};
      }
    });
  },

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


// --- Components ---

const Header = () => {
    const { undo, redo, historyIndex, history, rulers, toggleRulers } = useCanvasStore();
    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;
    const { config } = useBrandsoft();

    return (
        <header className="h-16 bg-black border-b border-gray-800 flex items-center justify-between px-4 z-20 text-white shrink-0">
             <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild className="text-white hover:bg-gray-800 hover:text-white">
                    <Link href="/templates"><ChevronLeft className="mr-2 h-4 w-4" /> Home</Link>
                </Button>
                <Separator orientation="vertical" className="h-6 bg-gray-700" />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                         <Button variant="ghost" size="sm" className="text-white hover:bg-gray-800 hover:text-white"><File className="mr-2 h-4 w-4" /> File</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-black text-white border-gray-700">
                        <DropdownMenuCheckboxItem checked={rulers.visible} onCheckedChange={toggleRulers}>
                            <Ruler className="mr-2 h-4 w-4" />
                            <span>Show Rulers</span>
                             {rulers.visible && <Check className="ml-auto h-4 w-4"/>}
                        </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="ghost" size="sm" className="text-white hover:bg-gray-800 hover:text-white">Resize</Button>
            </div>
            <div className="flex-1 text-center text-sm text-gray-400">
                <button className="hover:bg-gray-800 px-3 py-1 rounded-md">Untitled design</button>
            </div>
            <div className="flex items-center gap-2">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo} className="text-white hover:bg-gray-800 hover:text-white disabled:text-gray-500"><RefreshCcw /></Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Undo (Ctrl+Z)</p></TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo} className="text-white hover:bg-gray-800 hover:text-white disabled:text-gray-500"><RefreshCw /></Button>
                        </TooltipTrigger>
                         <TooltipContent><p>Redo (Ctrl+Y)</p></TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <Separator orientation="vertical" className="h-6 bg-gray-700" />
                <span className="text-xs text-gray-400 flex items-center gap-1.5"><UploadCloud className="h-4 w-4" /> All changes saved</span>
                 <Button className="bg-primary hover:bg-primary/90 text-primary-foreground"><Share className="mr-2 h-4 w-4" /> Share</Button>
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

const RulerGuide = ({ orientation, position }) => {
  const style = orientation === 'horizontal' 
    ? { top: position, left: 0, width: '100%', height: '1px' }
    : { left: position, top: 0, height: '100%', width: '1px' };

  return (
    <div
      style={style}
      className="absolute bg-blue-400 z-20 pointer-events-none"
    />
  );
};

const HorizontalRuler = ({ zoom, canvasPosition }) => {
    const rulerRef = useRef<HTMLDivElement>(null);
    const [ticks, setTicks] = useState([]);

    useEffect(() => {
        if (!rulerRef.current) return;
        const width = rulerRef.current.offsetWidth;
        const newTicks = [];
        // Adjust interval based on zoom level for readability
        const interval = zoom > 0.8 ? 50 : (zoom > 0.3 ? 100 : 200);
        const start = -Math.round(canvasPosition.x / (interval * zoom)) * interval;
        
        for (let i = start - interval * 5; i < start + width / zoom + interval * 5; i += interval) {
             if (i >= 0) newTicks.push(i);
        }
        setTicks(newTicks);
    }, [zoom, canvasPosition.x, rulerRef.current?.offsetWidth]);

    return (
        <div ref={rulerRef} className="absolute -top-6 left-0 h-6 w-full bg-gray-800 text-white text-xs overflow-hidden">
             <div className="absolute top-0 h-full" style={{ left: canvasPosition.x * zoom }}>
                {ticks.map(tick => (
                    <div key={`h-${tick}`} className="absolute top-0 h-full" style={{ left: tick * zoom }}>
                        <div className="w-px h-1.5 bg-gray-500" />
                        <span className="absolute top-2 -translate-x-1/2">{tick}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const VerticalRuler = ({ zoom, canvasPosition }) => {
    const rulerRef = useRef<HTMLDivElement>(null);
    const [ticks, setTicks] = useState([]);

    useEffect(() => {
        if (!rulerRef.current) return;
        const height = rulerRef.current.offsetHeight;
        const newTicks = [];
        const interval = zoom > 0.8 ? 50 : (zoom > 0.3 ? 100 : 200);
        const start = -Math.round(canvasPosition.y / (interval * zoom)) * interval;
        
        for (let i = start - interval * 5; i < start + height / zoom + interval * 5; i += interval) {
             if (i >= 0) newTicks.push(i);
        }
        setTicks(newTicks);

    }, [zoom, canvasPosition.y, rulerRef.current?.offsetHeight]);

    return (
        <div ref={rulerRef} className="absolute -left-6 top-0 w-6 h-full bg-gray-800 text-white text-xs overflow-hidden">
            <div className="absolute left-0 w-full" style={{ top: canvasPosition.y * zoom }}>
                {ticks.map(tick => (
                    <div key={`v-${tick}`} className="absolute left-0 w-full" style={{ top: tick * zoom }}>
                        <div className="h-px w-1.5 bg-gray-500 ml-auto" />
                        <span className="absolute left-1 -translate-y-1/2" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>{tick}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const Canvas = () => {
    const { elements, selectElement, zoom, setZoom, canvasPosition, setCanvasPosition, rulers, guides, addGuide } = useCanvasStore();
    const mainCanvasRef = useRef<HTMLDivElement>(null);
    const pageRef = useRef<HTMLDivElement>(null);
    const dragStart = useRef({ x: 0, y: 0, canvasX: 0, canvasY: 0 });

    const handleCanvasPan = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target !== mainCanvasRef.current && !(pageRef.current && pageRef.current.parentNode === e.target)) {
            return;
        }

        e.preventDefault();
        dragStart.current = { x: e.clientX, y: e.clientY, canvasX: canvasPosition.x, canvasY: canvasPosition.y };

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const dx = moveEvent.clientX - dragStart.current.x;
            const dy = moveEvent.clientY - dragStart.current.y;
            setCanvasPosition({ x: dragStart.current.canvasX + dx, y: dragStart.current.canvasY + dy });
        };
        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleRulerDrag = (orientation: 'horizontal' | 'vertical', startEvent: React.MouseEvent) => {
        startEvent.preventDefault();
        if (!pageRef.current) return;
        const canvasRect = pageRef.current.getBoundingClientRect();
        
        const handleMouseMove = (moveEvent: MouseEvent) => {
            let position;
            if (orientation === 'horizontal') {
                position = (moveEvent.clientY - canvasRect.top) / zoom;
            } else {
                position = (moveEvent.clientX - canvasRect.left) / zoom;
            }
            // A temporary guide could be shown here
        };

        const handleMouseUp = (upEvent: MouseEvent) => {
            let finalPosition;
            if (orientation === 'horizontal') {
                finalPosition = (upEvent.clientY - canvasRect.top) / zoom;
            } else {
                finalPosition = (upEvent.clientX - canvasRect.left) / zoom;
            }
             if(finalPosition > 0) { // Simple check to not add guides outside canvas
                addGuide(orientation, finalPosition);
            }
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();

        if (e.altKey) {
            // Zooming
            const newZoom = zoom - e.deltaY * 0.001;
            setZoom(newZoom);
        } else {
            // Panning
            setCanvasPosition({
                x: canvasPosition.x - e.deltaX,
                y: canvasPosition.y - e.deltaY
            });
        }
    };

    return (
        <main 
            ref={mainCanvasRef}
            className="flex-1 bg-gray-200 flex items-center justify-center p-8 overflow-hidden relative cursor-grab active:cursor-grabbing"
            onMouseDown={handleCanvasPan}
            onClick={() => selectElement(null)}
            onWheel={handleWheel}
        >
             {/* Rulers */}
            {rulers.visible && (
                <>
                    <div 
                        className="absolute top-0 left-0 h-6 w-full cursor-ns-resize z-30"
                        onMouseDown={(e) => handleRulerDrag('horizontal', e)}
                    >
                         <HorizontalRuler zoom={zoom} canvasPosition={canvasPosition}/>
                    </div>
                    <div 
                        className="absolute left-0 top-0 w-6 h-full cursor-ew-resize z-30"
                        onMouseDown={(e) => handleRulerDrag('vertical', e)}
                    >
                        <VerticalRuler zoom={zoom} canvasPosition={canvasPosition}/>
                    </div>
                    <div className="absolute top-0 left-0 h-6 w-6 bg-gray-800 z-30"/>
                </>
            )}

             <div 
                className="relative cursor-default"
                style={{
                    transform: `translate(${canvasPosition.x}px, ${canvasPosition.y}px) scale(${zoom})`,
                    transformOrigin: 'center center'
                }}
                onMouseDown={(e) => e.stopPropagation()} // Stop propagation to not deselect when clicking on page
            >
                <div
                    ref={pageRef}
                    className="relative bg-white shadow-lg"
                    style={{ 
                        width: '8.5in', 
                        height: '11in',
                    }}
                >
                    {/* Guides */}
                    {guides.horizontal.map(guide => <RulerGuide key={guide.id} orientation="horizontal" position={guide.y} />)}
                    {guides.vertical.map(guide => <RulerGuide key={guide.id} orientation="vertical" position={guide.x} />)}
                    
                    {/* Elements */}
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
                </div>
                
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                    <Button variant="outline" className="bg-white"><Plus className="mr-2 h-4 w-4" /> Add page</Button>
                </div>
            </div>
        </main>
    );
};

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

export default function DesignStudioPage() {
    return (
        <div className="flex flex-col h-screen w-screen bg-white text-gray-900">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                <LeftSidebar />
                <Canvas />
            </div>
            <Footer />
        </div>
    );
}
