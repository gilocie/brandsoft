
'use client';

import React from 'react';
import NextImage from 'next/image';
import backgroundImages from '@/lib/background-images';

const handleDragStart = (e: React.DragEvent, data: any) => {
    e.dataTransfer.setData('application/json', JSON.stringify(data));
};

const ImageItem = ({ src }: { src: string }) => {
    const imageData = {
        type: 'image' as const,
        width: 300,
        height: 200,
        rotation: 0,
        props: { src: src }
    };
    
    const name = src.split('/').pop()?.split('.')[0] || 'image';

    return (
        <div
            className="bg-gray-200 rounded-md flex items-center justify-center cursor-grab hover:bg-gray-300 transition-colors overflow-hidden aspect-video relative"
            draggable
            onDragStart={(e) => handleDragStart(e, imageData)}
        >
            <NextImage 
                src={src} 
                alt={name} 
                layout="fill"
                objectFit="cover"
                unoptimized
            />
        </div>
    );
};

export const ImagesPanel = () => {
    if (!backgroundImages || backgroundImages.length === 0) {
        return (
            <div className="p-4 text-center text-sm text-muted-foreground">
                No images found. Please add image paths to `src/lib/background-images.ts` and place the files in the `public/backgrounds` folder.
            </div>
        );
    }

    return (
        <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Backgrounds</h3>
            <div className="grid grid-cols-2 gap-4">
                {backgroundImages.map((src, index) => (
                    <ImageItem key={`${src}-${index}`} src={src} />
                ))}
            </div>
        </div>
    );
};
