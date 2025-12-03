
'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useCanvasStore } from '@/stores/canvas-store';

const handleDragStart = (e: React.DragEvent, data: any) => {
    e.dataTransfer.setData('application/json', JSON.stringify(data));
};

const ImageItem = ({ src, name }: { src: string, name: string }) => {
    const imageData = {
        type: 'image',
        width: 200,
        height: 150,
        rotation: 0,
        props: { src: src },
    };

    return (
        <div
            className="w-full aspect-[4/3] bg-gray-200 rounded-md flex items-center justify-center cursor-grab hover:bg-gray-300 transition-colors overflow-hidden"
            draggable
            onDragStart={(e) => handleDragStart(e, imageData)}
        >
            <Image src={src} alt={name} width={200} height={150} className="object-cover w-full h-full" />
        </div>
    );
};

export const ImagesPanel = () => {
    const { templateSettings } = useCanvasStore();
    const [images, setImages] = useState<{ name: string; src: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const category = templateSettings.templateName.toLowerCase();
        
        let imagePromise;

        if (category.includes('invoice') || category.includes('quotation')) {
            imagePromise = import('../../../inv-and-quots-backgrounds');
        } else if (category.includes('certificate')) {
             imagePromise = import('../../../certificate-backgrounds');
        } else {
            imagePromise = Promise.resolve({ default: [] });
        }

        imagePromise.then(module => {
            setImages(module.default);
            setIsLoading(false);
        }).catch(err => {
            console.error("Failed to load images for category:", category, err);
            setImages([]);
            setIsLoading(false);
        });

    }, [templateSettings.templateName]);
    
    const { addElement } = useCanvasStore();

    const handleImageClick = (src: string) => {
        addElement({
            type: 'image',
            x: 50,
            y: 50,
            width: 400,
            height: 300,
            rotation: 0,
            props: { src: src, objectFit: 'cover' },
        }, { select: true });
    };

    if (isLoading) {
        return <div className="p-4 text-center text-sm text-gray-400">Loading images...</div>;
    }

    if (images.length === 0) {
        return <div className="p-4 text-center text-sm text-gray-400">No images found for this category.</div>;
    }

    return (
        <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Backgrounds</h3>
            <div className="grid grid-cols-1 gap-4">
                {images.map(img => (
                    <div key={img.name} onClick={() => handleImageClick(img.src)} className="cursor-pointer">
                        <ImageItem src={img.src} name={img.name} />
                    </div>
                ))}
            </div>
        </div>
    );
};
