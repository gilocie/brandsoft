
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Type,
  Image as ImageIcon,
  Square,
  Trash2,
  Download,
  Eye,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  BringToFront,
  SendToBack
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"


const HeaderToolButton = ({ icon: Icon, label, shortcut }: { icon: React.ElementType, label: string, shortcut?: string }) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
                <Icon className="h-4 w-4" />
                <span className="sr-only">{label}</span>
            </Button>
        </TooltipTrigger>
        <TooltipContent>
            <p>{label} {shortcut && <span className="text-muted-foreground ml-2">{shortcut}</span>}</p>
        </TooltipContent>
    </Tooltip>
);

const LeftToolbarButton = ({ icon: Icon, label, isSelected, onClick }: { icon: React.ElementType, label: string, isSelected?: boolean, onClick?: () => void }) => (
    <Tooltip>
        <TooltipTrigger asChild>
             <button onClick={onClick} className={cn(
                "flex flex-col items-center justify-center w-full p-2 rounded-lg aspect-square transition-colors",
                isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            )}>
                <Icon className="h-6 w-6 mb-1" />
                <span className="text-xs font-medium">{label}</span>
            </button>
        </TooltipTrigger>
        <TooltipContent side="right">
            <p>{label}</p>
        </TooltipContent>
    </Tooltip>
);

const PropertiesSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{title}</h3>
        <div className="space-y-2">
            {children}
        </div>
    </div>
);


export default function NewTemplatePage() {
    const [selectedTool, setSelectedTool] = useState<'text' | 'image' | 'shape' | null>('text');
    const [selectedElement, setSelectedElement] = useState(true); // Mock selection
    
  return (
    <TooltipProvider>
    <div className="flex flex-col h-full max-h-screen bg-muted/30">
       {/* Header & Top Toolbar */}
       <header className="flex h-14 items-center gap-4 border-b bg-background px-2 md:px-4 flex-shrink-0">
          <Button variant="ghost" size="icon" asChild className="h-9 w-9">
            <Link href="/templates">
                <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Input defaultValue="Untitled Design" className="max-w-xs mx-auto text-center font-semibold border-none focus-visible:ring-0 shadow-none" />
           <Separator orientation="vertical" className="h-6" />
           <div className="flex items-center gap-1">
                <HeaderToolButton icon={Undo2} label="Undo" shortcut="Ctrl+Z" />
                <HeaderToolButton icon={Redo2} label="Redo" shortcut="Ctrl+Y" />
                <HeaderToolButton icon={ZoomOut} label="Zoom Out" />
                <HeaderToolButton icon={ZoomIn} label="Zoom In" />
           </div>
           <Separator orientation="vertical" className="h-6" />
           <div className="flex items-center gap-1">
                <HeaderToolButton icon={BringToFront} label="Bring to Front" />
                <HeaderToolButton icon={SendToBack} label="Send to Back" />
                <HeaderToolButton icon={AlignHorizontalJustifyCenter} label="Center Horizontally" />
                <HeaderToolButton icon={AlignVerticalJustifyCenter} label="Center Vertically" />
           </div>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="ghost" size="sm"><Eye className="mr-2 h-4 w-4"/>Preview</Button>
            <Button size="sm"><Download className="mr-2 h-4 w-4" /> Save</Button>
          </div>
       </header>

       <div className="flex flex-1 overflow-hidden">
            {/* Left Toolbar */}
            <aside className="w-20 flex-shrink-0 border-r bg-background p-2">
                <nav className="flex flex-col gap-2">
                    <LeftToolbarButton icon={Type} label="Text" isSelected={selectedTool === 'text'} onClick={() => setSelectedTool('text')} />
                    <LeftToolbarButton icon={ImageIcon} label="Image" isSelected={selectedTool === 'image'} onClick={() => setSelectedTool('image')} />
                    <LeftToolbarButton icon={Square} label="Shape" isSelected={selectedTool === 'shape'} onClick={() => setSelectedTool('shape')} />
                </nav>
            </aside>

            {/* Main Canvas Area */}
            <main className="flex-1 overflow-auto p-4 md:p-8">
                 <div className="bg-white mx-auto shadow-lg" style={{width: '8.5in', height: '11in'}}>
                    <div className="w-full h-full relative" id="canvas">
                        {/* Elements will be rendered here */}
                         <div className="absolute top-20 left-20 p-2 border-2 border-dashed border-primary cursor-move bg-primary/10">
                            <p className="text-4xl font-headline" style={{color: 'hsl(var(--primary))'}}>Your Company</p>
                        </div>
                        <div className="absolute top-40 left-20 p-2 border-2 border-dashed border-transparent hover:border-primary cursor-move">
                            <p className="text-lg">This is a sample text element. You can drag it around.</p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Right Properties Panel */}
            <aside className="w-80 flex-shrink-0 border-l bg-background p-4 overflow-y-auto">
                {selectedElement ? (
                    <div className="space-y-6">
                        <PropertiesSection title="Position">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label htmlFor="pos-x" className="text-xs text-muted-foreground">X</Label>
                                    <Input id="pos-x" type="number" defaultValue="80" className="h-8" />
                                </div>
                                <div>
                                    <Label htmlFor="pos-y" className="text-xs text-muted-foreground">Y</Label>
                                    <Input id="pos-y" type="number" defaultValue="80" className="h-8" />
                                </div>
                            </div>
                        </PropertiesSection>
                        <PropertiesSection title="Size">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label htmlFor="size-w" className="text-xs text-muted-foreground">W</Label>
                                    <Input id="size-w" type="number" defaultValue="300" className="h-8" />
                                </div>
                                <div>
                                    <Label htmlFor="size-h" className="text-xs text-muted-foreground">H</Label>
                                    <Input id="size-h" type="number" defaultValue="60" className="h-8" />
                                </div>
                            </div>
                        </PropertiesSection>

                        <PropertiesSection title="Text">
                            <div className="space-y-2">
                                <Label htmlFor="text-content">Content</Label>
                                <Input id="text-content" defaultValue="Your Company" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="font-size">Font Size</Label>
                                <Input id="font-size" type="number" defaultValue="36" />
                            </div>
                        </PropertiesSection>
                       
                        <PropertiesSection title="Fill">
                            <div className="flex items-center gap-2">
                                <Input id="font-color" type="color" defaultValue={'#9400D3'} className="p-1 h-8 w-8" />
                                <Input defaultValue="#9400D3" className="h-8" />
                            </div>
                        </PropertiesSection>

                        <PropertiesSection title="Stroke">
                            <div className="flex items-center gap-2">
                                <Input id="stroke-color" type="color" defaultValue={'#000000'} className="p-1 h-8 w-8" />
                                <Input defaultValue="#000000" className="h-8" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="stroke-width">Width</Label>
                                <Input id="stroke-width" type="number" defaultValue="0" />
                            </div>
                        </PropertiesSection>
                         <Separator />
                        <Button variant="destructive" className="w-full">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Element
                        </Button>
                    </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-full">
                            <p className="text-sm">Select an element on the canvas to see its properties.</p>
                        </div>
                    )}
            </aside>
       </div>
    </div>
    </TooltipProvider>
  );
}
