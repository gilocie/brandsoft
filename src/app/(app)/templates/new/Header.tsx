
'use client';

import React from 'react';
import {
  ChevronLeft,
  File,
  RefreshCcw,
  RefreshCw,
  Eye,
  Ruler,
  Check,
  Save
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { useBrandsoft } from '@/hooks/use-brandsoft';
import { useCanvasStore } from '@/stores/canvas-store';
import { exportAsImage, exportAsPdf, exportAsZip } from './canvas/utils/export';

interface HeaderProps {
    onSaveTemplate: () => void;
}

const Header = ({ onSaveTemplate }: HeaderProps) => {
    const { undo, redo, historyIndex, history, rulers, toggleRulers, pages, currentPageIndex } = useCanvasStore();
    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;
    const { config } = useBrandsoft();
    const isMultiPage = pages.length > 1;

    const handleExport = (format: 'png' | 'jpeg' | 'pdf') => {
        if (format === 'pdf') {
            exportAsPdf(pages, `design-${Date.now()}`);
            return;
        }

        if (isMultiPage) {
            exportAsZip(pages, format, `design-pages-${Date.now()}`);
        } else {
            const pageElement = document.getElementById(`page-${currentPageIndex}`);
            if (pageElement) {
                exportAsImage(pageElement, format, `design-${Date.now()}`);
            } else {
                console.error("Could not find page element to export.");
            }
        }
    };
    
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
                        <DropdownMenuItem>Save</DropdownMenuItem>
                        <DropdownMenuItem>Save As</DropdownMenuItem>
                        <DropdownMenuItem onClick={onSaveTemplate}>Save As Template</DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-gray-700"/>
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>Export</DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="bg-black text-white border-gray-700">
                                <DropdownMenuItem onClick={() => handleExport('png')}>as PNG {isMultiPage && '(ZIP)'}</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExport('jpeg')}>as JPEG {isMultiPage && '(ZIP)'}</DropdownMenuItem>
                                {isMultiPage && <DropdownMenuItem onClick={() => handleExport('pdf')}>as PDF</DropdownMenuItem>}
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator className="bg-gray-700"/>
                         <DropdownMenuItem>Options</DropdownMenuItem>
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
                            <DropdownMenuShortcut>Ctrl+Z</DropdownMenuShortcut>
                        </DropdownMenuItem>
                         <DropdownMenuItem onClick={redo} disabled={!canRedo}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            <span>Redo</span>
                            <DropdownMenuShortcut>Ctrl+Shift+Z</DropdownMenuShortcut>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-white hover:bg-gray-800 hover:text-white">View</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-black text-white border-gray-700">
                        <DropdownMenuCheckboxItem checked={rulers.visible} onCheckedChange={toggleRulers}>
                            <Ruler className="mr-2 h-4 w-4" />
                            <span>Show Rulers</span>
                             {rulers.visible && <Check className="ml-auto h-4 w-4"/>}
                        </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="flex-1 text-center">
                 <span className="text-xs text-gray-400 flex items-center gap-1.5 justify-center">
                    <Check className="h-3 w-3" /> All changes saved
                </span>
            </div>
            <div className="flex items-center gap-2">
                 <Button className="bg-primary hover:bg-primary/90 text-primary-foreground"><Eye className="mr-2 h-4 w-4" /> View Design</Button>
                 <Avatar className="h-9 w-9">
                    <AvatarImage src={config?.brand.logo} />
                    <AvatarFallback>{config?.brand.businessName?.[0]}</AvatarFallback>
                </Avatar>
            </div>
        </header>
    );
}

export default Header;
