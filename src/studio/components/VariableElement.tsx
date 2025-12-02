
'use client';

// This component will render a dynamic variable (e.g., {{client_name}}) on the canvas.
// For now, it's a simple placeholder.

import React from 'react';

interface VariableElementProps {
    variable: string;
    // We will add props for styling like font, size, color, etc.
}

export default function VariableElement({ variable }: VariableElementProps) {
    // In a real scenario, this would also take a data context to resolve the variable's value.
    return <p>{variable}</p>;
}
