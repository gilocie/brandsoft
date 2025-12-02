
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
    ArrowLeft,
    Undo2,
    Redo2,
    ZoomIn,
    ZoomOut,
    Download,
    Eye,
    AlignHorizontalJustifyCenter,
    AlignVerticalJustifyCenter,
    BringToFront,
    SendToBack
} from 'lucide-react';
import Link from 'next/link';
import React from 'react';

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

export default function Toolbar() {
    return (
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
                <Button variant="ghost" size="sm"><Eye className="mr-2 h-4 w-4" />Preview</Button>
                <Button size="sm"><Download className="mr-2 h-4 w-4" /> Save</Button>
            </div>
        </header>
    );
}
