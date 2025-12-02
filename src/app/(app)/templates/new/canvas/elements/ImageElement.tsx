'use client';

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useCanvasStore, type CanvasElement } from '@/stores/canvas-store';
import { ElementWrapper } from './ElementWrapper';

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
            <img src={element.props.src} alt="" style={{ width: '100%', height: '100%', objectFit: element.props.objectFit || 'cover', pointerEvents: 'none' }} draggable={false} />
            {isSelected && element.props.isTemplateField && <Button variant="secondary" size="sm" className="absolute bottom-1 right-1 h-6 text-xs" onClick={() => imageInputRef.current?.click()}>Replace</Button>}
        </ElementWrapper>
    );
};
