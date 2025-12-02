'use client';

import React, { useCallback, useEffect } from 'react';
import { useCanvasStore, type CanvasElement } from '@/stores/canvas-store';
import { ElementWrapper } from './ElementWrapper';

interface TextElementProps { element: CanvasElement; isSelected: boolean; }

export const TextElement = ({ element, isSelected }: TextElementProps) => {
    const { updateElementProps } = useCanvasStore();
    const baseFontSize = element.props.fontSize || 14;
    const baseHeight = 40;
    const padding = 8;

    const getCurrentFontSize = useCallback(() => Math.max(8, Math.min(200, baseFontSize * (element.height / baseHeight))), [element.height, baseFontSize]);

    useEffect(() => {
        const newSize = getCurrentFontSize();
        if (Math.abs(newSize - baseFontSize) > 1) {
             // This logic seems recursive and might cause issues. 
             // Let's rely on manual font size adjustment from the sidebar for now.
             // updateElementProps(element.id, { fontSize: Math.round(newSize) });
        }
    }, [element.height, baseFontSize, element.id, getCurrentFontSize, updateElementProps]);

    const measureText = (text: string, fontSize: number) => {
        const measure = document.getElementById('text-measure');
        if (!measure) return { width: 100, height: 20 };
        measure.style.fontSize = `${fontSize}px`;
        measure.style.fontFamily = element.props.fontFamily || 'Arial';
        measure.style.fontWeight = String(element.props.fontWeight || 400);
        measure.textContent = text;
        return { width: measure.offsetWidth, height: measure.offsetHeight };
    };

    const calculateMinSize = () => {
        const fontSize = getCurrentFontSize();
        const words = (element.props.text || '').split(/\s+/);
        let maxWordWidth = 0;
        words.forEach(w => { const d = measureText(w, fontSize); if (d.width > maxWordWidth) maxWordWidth = d.width; });
        return { minWidth: Math.max(30, maxWordWidth + padding * 2), minHeight: Math.max(20, fontSize * 1.3 + padding * 2) };
    };

    return (
        <ElementWrapper element={element} isSelected={isSelected} onCalculateMinSize={calculateMinSize} borderStyle="dashed">
            <div style={{
                width: '100%', height: '100%', display: 'flex', alignItems: 'center',
                justifyContent: element.props.textAlign === 'left' ? 'flex-start' : element.props.textAlign === 'right' ? 'flex-end' : 'center',
                textAlign: element.props.textAlign || 'center', fontSize: `${getCurrentFontSize()}px`,
                color: element.props.color || '#000000', fontFamily: element.props.fontFamily || 'Arial',
                fontWeight: element.props.fontWeight || 400, lineHeight: element.props.lineHeight || 1.3,
                letterSpacing: element.props.letterSpacing ? `${element.props.letterSpacing}px` : 'normal',
                padding: `${padding}px`, wordWrap: 'break-word', overflowWrap: 'break-word',
                whiteSpace: 'normal', overflow: 'hidden', pointerEvents: 'none',
            }}>
                {element.props.text}
            </div>
        </ElementWrapper>
    );
};
