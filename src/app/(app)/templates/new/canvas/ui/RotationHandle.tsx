'use client';

import React from 'react';
import { RotateCw } from 'lucide-react';
import { getRotationCursor } from '../utils';

interface RotationHandleProps {
    onRotateStart: (e: React.MouseEvent) => void;
}

export const RotationHandle = ({ onRotateStart }: RotationHandleProps) => (
    <>
        <div style={{ position: 'absolute', top: '-24px', left: '50%', transform: 'translateX(-50%)', width: '1px', height: '18px', backgroundColor: '#3b82f6', zIndex: 10 }} />
        <div
            style={{
                position: 'absolute', top: '-36px', left: '50%', transform: 'translateX(-50%)',
                width: '20px', height: '20px', backgroundColor: 'white', border: '2px solid #3b82f6',
                borderRadius: '50%', cursor: getRotationCursor(), display: 'flex',
                alignItems: 'center', justifyContent: 'center', zIndex: 11,
            }}
            onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); onRotateStart(e); }}
        >
            <RotateCw size={12} className="text-blue-500" />
        </div>
    </>
);
