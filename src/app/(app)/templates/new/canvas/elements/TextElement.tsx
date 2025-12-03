'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { useCanvasStore, type CanvasElement, getLiveValue } from '@/stores/canvas-store';
import { ElementWrapper } from './ElementWrapper';

interface TextElementProps {
    element: CanvasElement;
    isSelected: boolean;
}

export const TextElement = ({ element, isSelected }: TextElementProps) => {
    const { updateElement, updateElementProps } = useCanvasStore();
    const prevFontSizeRef = useRef(element.props.fontSize || 14);
    const baseFontSize = element.props.fontSize || 14;
    const padding = 8;

    const textToShow = element.props.dataField ? getLiveValue(element.props.dataField) : element.props.text;

    // Calculate display font size based on element dimensions
    const getDisplayFontSize = useCallback(() => {
        return baseFontSize;
    }, [baseFontSize]);

    // Measure text for minimum size calculation
    const measureText = (text: string, fontSize: number) => {
        const measure = document.getElementById('text-measure');
        if (!measure) return { width: 100, height: 20 };
        measure.style.fontSize = `${fontSize}px`;
        measure.style.fontFamily = element.props.fontFamily || 'Arial';
        measure.style.fontWeight = String(element.props.fontWeight || 400);
        measure.textContent = text;
        return { width: measure.offsetWidth, height: measure.offsetHeight };
    };

    // Calculate minimum size based on text content
    const calculateMinSize = useCallback(() => {
        const fontSize = baseFontSize;
        const text = textToShow || '';
        const words = text.split(/\s+/);
        let maxWordWidth = 0;
        words.forEach(w => {
            const d = measureText(w, fontSize);
            if (d.width > maxWordWidth) maxWordWidth = d.width;
        });

        // Calculate lines needed
        const lineHeight = fontSize * (element.props.lineHeight || 1.3);
        const lines = Math.ceil(text.length / 20) || 1; // Rough estimate

        return {
            minWidth: Math.max(40, maxWordWidth + padding * 2),
            minHeight: Math.max(30, lineHeight * lines + padding * 2),
        };
    }, [baseFontSize, textToShow, element.props.fontFamily, element.props.fontWeight, element.props.lineHeight]);

    // Update element size when font size changes via slider
    useEffect(() => {
        const prevFontSize = prevFontSizeRef.current;
        const newFontSize = element.props.fontSize || 14;

        if (prevFontSize !== newFontSize) {
            const scale = newFontSize / prevFontSize;

            // Scale the bounding box proportionally
            const newWidth = Math.max(40, element.width * scale);
            const newHeight = Math.max(30, element.height * scale);

            updateElement(element.id, {
                width: newWidth,
                height: newHeight,
            });

            prevFontSizeRef.current = newFontSize;
        }
    }, [element.props.fontSize, element.id, updateElement]);

    return (
        <ElementWrapper
            element={element}
            isSelected={isSelected}
            onCalculateMinSize={calculateMinSize}
            borderStyle="dashed"
        >
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: element.props.textAlign === 'left' ? 'flex-start' :
                        element.props.textAlign === 'right' ? 'flex-end' : 'center',
                    textAlign: element.props.textAlign || 'center',
                    fontSize: `${getDisplayFontSize()}px`,
                    color: element.props.color || '#000000',
                    fontFamily: element.props.fontFamily || 'Arial',
                    fontWeight: element.props.fontWeight || 400,
                    lineHeight: element.props.lineHeight || 1.3,
                    letterSpacing: element.props.letterSpacing ? `${element.props.letterSpacing}px` : 'normal',
                    padding: `${padding}px`,
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    whiteSpace: 'normal',
                    overflow: 'hidden',
                    pointerEvents: 'none',
                }}
            >
                {textToShow}
            </div>
        </ElementWrapper>
    );
};
