
'use client';

import React from 'react';
import {
  ChevronLeft,
  File,
  RefreshCcw,
  RefreshCw,
  UploadCloud,
  Share,
  Ruler,
  Check
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useBrandsoft } from '@/hooks/use-brandsoft';
import { useCanvasStore } from '@/stores/canvas-store';

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

export default Header;
