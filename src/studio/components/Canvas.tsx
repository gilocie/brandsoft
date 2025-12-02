
'use client';

import { useCanvas, type CanvasElement } from '../hooks/useCanvas';
import { useDrag } from '../hooks/useDrag';

const Element = ({ element }: { element: CanvasElement }) => {
    const { updateElement } = useCanvas();

    const handleDrag = (x: number, y: number) => {
        updateElement(element.id, { x, y });
    };

    const { onDragStart, isDragging } = useDrag({ onDrag: handleDrag });

    return (
        <div
            title={`${element.type.charAt(0).toUpperCase() + element.type.slice(1)} Element`}
            onMouseDown={onDragStart}
            className="absolute p-2 border-2 border-dashed border-transparent hover:border-primary"
            style={{
                left: `${element.x}px`,
                top: `${element.y}px`,
                width: `${element.width}px`,
                height: `${element.height}px`,
                cursor: isDragging ? 'grabbing' : 'grab',
                outline: 'none', // To prevent focus outlines on drag
            }}
        >
            {element.type === 'text' && (
                <p
                    className="w-full h-full"
                    style={{
                        fontSize: `${element.fontSize}px`,
                        fontFamily: element.fontFamily,
                        color: element.color,
                        fontWeight: element.bold ? 'bold' : 'normal',
                        fontStyle: element.italic ? 'italic' : 'normal',
                        textDecoration: element.underline ? 'underline' : 'none',
                    }}
                >
                    {element.text}
                </p>
            )}
        </div>
    );
};

export default function Canvas() {
    const { elements } = useCanvas();
    return (
        <div className="bg-white mx-auto shadow-lg" style={{ width: '8.5in', height: '11in' }}>
            <div className="w-full h-full relative" id="canvas">
                {elements.map((el) => (
                    <Element key={el.id} element={el} />
                ))}
            </div>
        </div>
    );
}
