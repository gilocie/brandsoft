
'use client';

// This component will render an image on the canvas.
// For now, it's a simple placeholder.

import React from 'react';

interface ImageElementProps {
    src: string;
    alt: string;
    // We will add props for styling like opacity, border-radius, etc.
}

export default function ImageElement({ src, alt }: ImageElementProps) {
    return <img src={src} alt={alt} />;
}
