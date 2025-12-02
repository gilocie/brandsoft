
'use client';

import React from 'react';
import Header from './Header';
import LeftSidebar from './LeftSidebar';
import Canvas from './Canvas';
import Footer from './Footer';

export default function DesignStudioPage() {
    return (
        <div className="flex flex-col h-screen w-screen bg-white text-gray-900">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                <LeftSidebar />
                <Canvas />
            </div>
            <Footer />
        </div>
    );
}
