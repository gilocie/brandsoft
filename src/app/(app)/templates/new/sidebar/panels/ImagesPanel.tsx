'use client';

import React, { useState, useEffect } from 'react';
import { useCanvasStore } from '@/stores/canvas-store';
import { Loader2 } from 'lucide-react';

const handleDragStart = (e: React.DragEvent, data: any) => {
    e.dataTransfer.setData('application/json', JSON.stringify(data));
};

const ImageItem = ({ image }: { image: { name: string, src: string } }) => {
    const imageData = {
        type: 'image',
        width: 300,
        height: 200,
        rotation: 0,
        props: { src: image.src }
    };

    return (
        <div
            className="bg-gray-200 rounded-md flex items-center justify-center cursor-grab hover:bg-gray-300 transition-colors overflow-hidden aspect-video"
            draggable
            onDragStart={(e) => handleDragStart(e, imageData)}
        >
            <img 
                src={image.src} 
                alt={image.name} 
                className="w-full h-full object-cover"
            />
        </div>
    );
};

export const ImagesPanel = () => {
    const { templateSettings } = useCanvasStore();
    const [images, setImages] = useState<{ name: string; src: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const currentCategory = templateSettings?.category;

    useEffect(() => {
        let isMounted = true;
        setIsLoading(true);

        const loadImages = async () => {
            let imageModule;
            try {
                if (currentCategory === 'invoice' || currentCategory === 'quotation') {
                    imageModule = await import('@/app/(app)/templates/inv-and-quots-backgrounds');
                } else if (currentCategory === 'certificate') {
                    imageModule = await import('@/app/(app)/templates/certificate-backgrounds');
                }
                
                if (isMounted && imageModule) {
                    setImages(imageModule.default);
                }
            } catch (error) {
                console.error("Could not load images for category:", currentCategory, error);
                 if (isMounted) {
                    setImages([]);
                 }
            } finally {
                 if (isMounted) {
                    setIsLoading(false);
                 }
            }
        };

        loadImages();

        return () => {
            isMounted = false;
        };
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
                No images found for this category. Add images to the appropriate folder.
            </div>
        );
    }

    return (
        <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Backgrounds</h3>
            <div className="grid grid-cols-2 gap-4">
                {images.map((image) => (
                    <ImageItem key={image.name} image={image} />
                ))}
            </div>
        </div>
    );
};
