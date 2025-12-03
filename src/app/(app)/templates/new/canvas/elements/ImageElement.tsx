'use client';

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useCanvasStore, type CanvasElement } from '@/stores/canvas-store';
import { ElementWrapper } from './ElementWrapper';
import { ImagePlus, UploadCloud } from 'lucide-react';

interface ImageElementProps { element: CanvasElement; isSelected: boolean; }

export const ImageElement = ({ element, isSelected }: ImageElementProps) => {
    const { updateElementProps, commitHistory } = useCanvasStore();
    const imageInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => { updateElementProps(element.id, { src: event.target?.result as string }); commitHistory(); };
            reader.readAsDataURL(file);
        }
    };

    return (
        <ElementWrapper element={element} isSelected={isSelected} minWidth={20} minHeight={20}>
            <input type="file" accept="image/*" ref={imageInputRef} className="hidden" onChange={handleImageUpload} />
            {element.props.src ? (
                <img src={element.props.src} alt="" style={{ width: '100%', height: '100%', objectFit: element.props.objectFit || 'cover', pointerEvents: 'none' }} draggable={false} />
            ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center border border-dashed">
                    <div className="text-center text-gray-500">
                         <ImagePlus className="mx-auto h-8 w-8" />
                    </div>
                </div>
            )}
             {isSelected && (
                <Button variant="secondary" size="sm" className="absolute bottom-1 right-1 h-6 text-xs" onClick={() => imageInputRef.current?.click()}>
                   <UploadCloud className="h-3 w-3 mr-1" />
                   {element.props.src ? 'Replace' : 'Upload'}
                </Button>
             )}
        </ElementWrapper>
    );
};
