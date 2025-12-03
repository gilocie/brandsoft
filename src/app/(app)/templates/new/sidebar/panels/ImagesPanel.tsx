'use client';

import React, { useMemo } from 'react';
import { useCanvasStore } from '@/stores/canvas-store';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const handleDragStart = (e: React.DragEvent, data: any) => {
    e.dataTransfer.setData('application/json', JSON.stringify(data));
};

const ImageItem = ({ image }: { image: typeof PlaceHolderImages[0] }) => {
    const imageData = {
        type: 'image',
        width: 300,
        height: 200,
        rotation: 0,
        props: { src: image.imageUrl }
    };

    return (
        <div
            className="bg-gray-200 rounded-md flex items-center justify-center cursor-grab hover:bg-gray-300 transition-colors overflow-hidden aspect-video"
            draggable
            onDragStart={(e) => handleDragStart(e, imageData)}
        >
            <img 
                src={image.imageUrl} 
                alt={image.description} 
                className="w-full h-full object-cover"
                data-ai-hint={image.imageHint}
            />
        </div>
    );
};

export const ImagesPanel = () => {
    const { pages, currentPageIndex } = useCanvasStore();
    const currentPage = pages[currentPageIndex];
    // This is a placeholder as templateSettings isn't fully implemented in the store for category tracking.
    // To make this truly dynamic, the template's category needs to be saved and accessed here.
    const currentCategory = 'invoice'; // Mock data, replace with real store data when available

    const filteredImages = useMemo(() => {
        const categoriesToShow: string[] = [];
        
        if (!currentCategory) {
            return PlaceHolderImages;
        }

        if (currentCategory === 'invoice' || currentCategory === 'quotation') {
            categoriesToShow.push('invoice', 'quotation');
        } else if (currentCategory === 'certificate') {
            categoriesToShow.push('certificate');
        }
        
        return PlaceHolderImages.filter(img => categoriesToShow.includes(img.category));
    }, [currentCategory]);

    if (filteredImages.length === 0) {
        return (
            <div className="p-4 text-center text-sm text-muted-foreground">
                No images found for this category.
            </div>
        );
    }

    return (
        <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Backgrounds</h3>
            <div className="grid grid-cols-2 gap-4">
                {filteredImages.map((image) => (
                    <ImageItem key={image.id} image={image} />
                ))}
            </div>
        </div>
    );
};
