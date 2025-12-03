
'use client';

import React, { useState, useEffect } from 'react';
import { useCanvasStore } from '@/stores/canvas-store';
import { Loader2 } from 'lucide-react';
import certificateImageData from '@/lib/certificate-images';
import invoiceImageData from '@/lib/invoice-images';

const handleDragStart = (e: React.DragEvent, data: any) => {
    e.dataTransfer.setData('application/json', JSON.stringify(data));
};

const ImageItem = ({ image }: { image: { src: any, name: string } }) => {
    const imageData = {
        type: 'image',
        width: 300,
        height: 200,
        rotation: 0,
        props: { src: image.src.default }
    };

    return (
        <div
            className="bg-gray-200 rounded-md flex items-center justify-center cursor-grab hover:bg-gray-300 transition-colors overflow-hidden aspect-video"
            draggable
            onDragStart={(e) => handleDragStart(e, imageData)}
        >
            <img 
                src={image.src.default} 
                alt={image.name} 
                className="w-full h-full object-cover"
            />
        </div>
    );
};

export const ImagesPanel = () => {
    const { templateSettings } = useCanvasStore();
    const [images, setImages] = useState<{ name: string; src: any }[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const currentCategory = templateSettings?.category || 'invoice';

    useEffect(() => {
        setIsLoading(true);
        if (currentCategory === 'invoice' || currentCategory === 'quotation') {
            setImages(invoiceImageData);
        } else if (currentCategory === 'certificate') {
            setImages(certificateImageData);
        } else {
            setImages([]);
        }
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
                No images found for the '{currentCategory}' category. Add images to the manifest file.
            </div>
        );
    }

    return (
        <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Backgrounds</h3>
            <div className="grid grid-cols-2 gap-4">
                {images.map((image, index) => (
                    <ImageItem key={`${image.name}-${index}`} image={image} />
                ))}
            </div>
        </div>
    );
};
