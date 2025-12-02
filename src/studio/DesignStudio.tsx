
'use client';

import { TooltipProvider } from '@/components/ui/tooltip';
import Canvas from './components/Canvas';
import ElementsPanel from './components/ElementsPanel';
import PropertiesPanel from './components/PropertiesPanel';
import Toolbar from './components/Toolbar';

export default function DesignStudio() {
    return (
        <TooltipProvider>
            <div className="flex flex-col h-screen w-screen bg-muted/30">
                <Toolbar />
                <div className="flex flex-1 overflow-hidden">
                    <ElementsPanel />
                    <main className="flex-1 overflow-auto p-4 md:p-8">
                        <Canvas />
                    </main>
                    <PropertiesPanel />
                </div>
            </div>
        </TooltipProvider>
    );
}
