
'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Type, Image as ImageIcon, Square, Pilcrow, CaseUpper, Calendar, Hash } from 'lucide-react';
import React, { useState } from 'react';

const StaticElementButton = ({ icon: Icon, label }: { icon: React.ElementType, label: string }) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <button className={cn(
                "flex flex-col items-center justify-center w-full p-2 rounded-lg aspect-square transition-colors hover:bg-muted"
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

const VariableElement = ({ label, variable }: { label: string, variable: string }) => (
     <div className="p-2 text-xs border rounded-md cursor-grab hover:bg-muted active:cursor-grabbing">
        <span className="font-mono bg-muted/80 p-1 rounded-sm">{variable}</span>
        <p className="text-muted-foreground mt-1">{label}</p>
    </div>
);


export default function ElementsPanel() {
    return (
        <aside className="w-60 flex-shrink-0 border-r bg-background p-2 space-y-4">
             <div>
                <h3 className="text-sm font-semibold mb-2 px-2">Static Elements</h3>
                <nav className="grid grid-cols-2 gap-1">
                    <StaticElementButton icon={Type} label="Text" />
                    <StaticElementButton icon={ImageIcon} label="Image" />
                    <StaticElementButton icon={Square} label="Shape" />
                </nav>
            </div>
             <div>
                <h3 className="text-sm font-semibold mb-2 px-2">Invoice Variables</h3>
                <div className="space-y-1">
                    <VariableElement label="Invoice Number" variable="{{invoice_number}}" />
                    <VariableElement label="Client Name" variable="{{client_name}}" />
                    <VariableElement label="Date" variable="{{date}}" />
                    <VariableElement label="Total Amount" variable="{{total}}" />
                </div>
            </div>
        </aside>
    );
}
