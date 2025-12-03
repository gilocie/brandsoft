'use client';

import React, { useState, useEffect } from 'react';
import { useCanvasStore } from '@/stores/canvas-store';
import { Loader2 } from 'lucide-react';
import NextImage from 'next/image';
import invoiceImages from '@/lib/invoice-images';
import certificateImages from '@/lib/certificate-images';

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
    
    // Extract name from src, e.g. /inv-and-quots0.jpg -> inv-and-quots0
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
    const { templateSettings } = useCanvasStore();
    const [images, setImages] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const currentCategory = templateSettings?.category || 'invoice';

    useEffect(() => {
        setIsLoading(true);
        let relevantImages: string[] = [];

        if (currentCategory === 'invoice' || currentCategory === 'quotation') {
            relevantImages = invoiceImages;
        } else {
            relevantImages = certificateImages;
        }

        setImages(relevantImages);
        setIsLoading(false);

    }, [currentCategory]);


    if (isLoading) {
        return (
            <div className="p-4 flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }
    
    if (images.length === 0) {
        return (
            <div className="p-4 text-center text-sm text-muted-foreground">
                No images found for the '{currentCategory}' category. Add images to the `/public` folder and update the manifest files in `/src/lib/`.
            </div>
        );
    }

    return (
        <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Backgrounds</h3>
            <div className="grid grid-cols-2 gap-4">
                {images.map((src, index) => (
                    <ImageItem key={`${src}-${index}`} src={src} />
                ))}
            </div>
        </div>
    );
};
