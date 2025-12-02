
'use client';

// This component will render a text block on the canvas.
// For now, it's a simple placeholder.

import React from 'react';

interface TextElementProps {
    text: string;
    // We will add props for styling like font, size, color, etc.
}

export default function TextElement({ text }: TextElementProps) {
    return <p>{text}</p>;
}
