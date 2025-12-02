
'use client';

// This component will render a shape (rectangle, circle, etc.) on the canvas.
// For now, it's a simple placeholder.

import React from 'react';

interface ShapeElementProps {
    type: 'rectangle' | 'circle' | 'line';
    // We will add props for styling like fill, stroke, etc.
}

export default function ShapeElement({ type }: ShapeElementProps) {
    // Render logic will go here
    return <div>Shape: {type}</div>;
}
