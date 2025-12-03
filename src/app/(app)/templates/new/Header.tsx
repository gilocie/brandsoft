
'use client';

import React from 'react';
import {
  ChevronLeft,
  File,
  RefreshCcw,
  RefreshCw,
  Share,
  Ruler,
  Check,
  Save
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useBrandsoft } from '@/hooks/use-brandsoft';
import { useCanvasStore } from '@/stores/canvas-store';

interface HeaderProps {
    onSaveTemplate: () => void;
}

const Header = ({ onSaveTemplate }: HeaderProps) => {
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
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-white hover:bg-gray-800 hover:text-white">Edit</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-black text-white border-gray-700">
                        <DropdownMenuItem onClick={undo} disabled={!canUndo}>
                            <RefreshCcw className="mr-2 h-4 w-4" />
                            <span>Undo</span>
                            <DropdownMenuShortcut>⌘Z</DropdownMenuShortcut>
                        </DropdownMenuItem>
                         <DropdownMenuItem onClick={redo} disabled={!canRedo}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            <span>Redo</span>
                            <DropdownMenuShortcut>⇧⌘Z</DropdownMenuShortcut>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="flex-1 text-center text-sm text-gray-400">
                <button className="hover:bg-gray-800 px-3 py-1 rounded-md">Untitled design</button>
            </div>
            <div className="flex items-center gap-2">
                 <Button variant="outline" size="sm" className="text-white bg-transparent border-gray-600 hover:bg-gray-800 hover:text-white" onClick={onSaveTemplate}>
                    <Save className="mr-2 h-4 w-4" /> Save As Template
                </Button>
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
