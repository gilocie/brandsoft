
'use client';

import React, { useState } from 'react';
import Header from './Header';
import LeftSidebar from './LeftSidebar';
import ElementsPanel from './ElementsPanel';
import Canvas from './Canvas';
import Footer from './Footer';
import RightSidebar from './RightSidebar';

export default function DesignStudioPage() {
    const [activeTool, setActiveTool] = useState<string | null>('Fields');

    return (
        <div className="flex flex-col h-screen w-screen bg-white text-gray-900">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                <LeftSidebar activeTool={activeTool} setActiveTool={setActiveTool} />
                <ElementsPanel activeTool={activeTool} />
                <Canvas />
                <RightSidebar />
            </div>
            <Footer />
        </div>
    );
}
