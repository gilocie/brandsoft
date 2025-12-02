
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Type, Image as ImageIcon, Square, Trash2, ArrowLeft, Download, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const ToolbarButton = ({ icon: Icon, label, onClick }: { icon: React.ElementType, label: string, onClick?: () => void }) => (
    <button onClick={onClick} className="flex flex-col items-center justify-center w-full p-2 rounded-lg hover:bg-muted aspect-square transition-colors">
        <Icon className="h-6 w-6 mb-1" />
        <span className="text-xs">{label}</span>
    </button>
);


export default function NewTemplatePage() {
    const [selectedTool, setSelectedTool] = useState<'text' | 'image' | 'shape' | null>('text');
    
  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-120px)] bg-muted/30">
        {/* Header */}
       <header className="flex h-14 items-center gap-4 border-b bg-background px-4 md:px-6 sticky top-0 z-20">
          <Button variant="outline" size="sm" asChild>
            <Link href="/templates">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Templates
            </Link>
          </Button>
          <div className="flex-1 text-center">
            <Input defaultValue="Untitled Design" className="max-w-xs mx-auto text-center font-semibold" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm"><Eye className="mr-2 h-4 w-4"/>Preview</Button>
            <Button size="sm"><Download className="mr-2 h-4 w-4" /> Save</Button>
          </div>
       </header>

       <div className="flex flex-1 overflow-hidden">
            {/* Left Toolbar */}
            <aside className="w-20 flex-shrink-0 border-r bg-background p-2">
                <nav className="flex flex-col gap-2">
                    <ToolbarButton icon={Type} label="Text" onClick={() => setSelectedTool('text')} />
                    <ToolbarButton icon={ImageIcon} label="Image" onClick={() => setSelectedTool('image')} />
                    <ToolbarButton icon={Square} label="Shape" onClick={() => setSelectedTool('shape')} />
                </nav>
            </aside>

            {/* Main Canvas Area */}
            <main className="flex-1 overflow-auto p-4 md:p-8">
                 <div className="bg-white mx-auto shadow-lg" style={{width: '8.5in', height: '11in'}}>
                    <div className="w-full h-full relative" id="canvas">
                        {/* Elements will be rendered here */}
                         <div className="absolute top-20 left-20 p-2 border border-dashed border-primary cursor-move">
                            <p className="text-4xl font-headline" style={{color: 'hsl(var(--primary))'}}>Your Company</p>
                        </div>
                        <div className="absolute top-40 left-20 p-2 border border-dashed border-transparent cursor-move">
                            <p className="text-lg">This is a sample text element. You can drag it around.</p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Right Properties Panel */}
            <aside className="w-80 flex-shrink-0 border-l bg-background p-4 overflow-y-auto">
                <Card className="border-none shadow-none">
                    <CardHeader>
                        <CardTitle>Properties</CardTitle>
                    </CardHeader>
                    {selectedTool ? (
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="text-content">Text</Label>
                                <Input id="text-content" defaultValue="Your Company" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="font-size">Font Size</Label>
                                <Input id="font-size" type="number" defaultValue="36" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="font-color">Color</Label>
                                <Input id="font-color" type="color" defaultValue={'#9400D3'} className="p-1" />
                            </div>
                            <Separator />
                            <Button variant="destructive" className="w-full">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Element
                            </Button>
                        </CardContent>
                    ) : (
                        <CardContent>
                            <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-40">
                                <p>Select an element on the canvas to see its properties.</p>
                            </div>
                        </CardContent>
                    )}
                </Card>
            </aside>
       </div>
    </div>
  );
}
