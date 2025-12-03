
'use client';

import React, { useState } from 'react';
import {
  ChevronLeft,
  File,
  RefreshCcw,
  RefreshCw,
  Eye,
  Ruler,
  Check,
  Save,
  Download,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useBrandsoft } from '@/hooks/use-brandsoft';
import { useCanvasStore } from '@/stores/canvas-store';
import { exportAsImage, exportAsPdf, exportAsZip } from './canvas/utils/export';

const ExportDialog = ({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) => {
    const { pages, currentPageIndex } = useCanvasStore();
    const [format, setFormat] = useState<'png' | 'jpeg' | 'pdf'>('png');
    const [exportScope, setExportScope] = useState<'current' | 'all'>('current');
    const isMultiPage = pages.length > 1;

    const handleExport = () => {
        if (format === 'pdf') {
            exportAsPdf(pages, `design-${Date.now()}`);
        } else {
            if (isMultiPage && exportScope === 'all') {
                exportAsZip(pages, format, `design-pages-${Date.now()}`);
            } else {
                const pageElement = document.getElementById(`page-${currentPageIndex}`);
                if (pageElement) {
                    exportAsImage(pageElement, format, `page-${currentPageIndex + 1}-${Date.now()}`);
                }
            }
        }
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Export Design</DialogTitle>
                    <DialogDescription>Choose your export format and options.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="format">Format</Label>
                        <Select value={format} onValueChange={(v) => setFormat(v as any)}>
                            <SelectTrigger id="format"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="png">PNG</SelectItem>
                                <SelectItem value="jpeg">JPEG</SelectItem>
                                <SelectItem value="pdf">PDF</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {isMultiPage && format !== 'pdf' && (
                        <div className="space-y-2">
                            <Label>Pages</Label>
                            <RadioGroup value={exportScope} onValueChange={(v) => setExportScope(v as any)}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="current" id="r1" />
                                    <Label htmlFor="r1">Export current page only</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="all" id="r2" />
                                    <Label htmlFor="r2">Export all pages as ZIP</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    )}
                     {format === 'pdf' && isMultiPage && (
                        <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                           All pages will be combined into a single PDF document.
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Export</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

interface HeaderProps {
    onSaveTemplate: () => void;
}

const Header = ({ onSaveTemplate }: HeaderProps) => {
    const { undo, redo, historyIndex, history, rulers, toggleRulers } = useCanvasStore();
    const [isExportOpen, setIsExportOpen] = useState(false);
    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;
    const { config } = useBrandsoft();
    
    return (
        <>
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
                        <DropdownMenuItem onSelect={onSaveTemplate}>
                           <Save className="mr-2 h-4 w-4" /> Save As Template
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setIsExportOpen(true)}>
                           <Download className="mr-2 h-4 w-4" /> Export
                        </DropdownMenuItem>
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
                            <DropdownMenuShortcut>Ctrl+Y</DropdownMenuShortcut>
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
        <ExportDialog isOpen={isExportOpen} onOpenChange={setIsExportOpen} />
        </>
    );
}

export default Header;
