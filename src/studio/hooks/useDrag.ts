
import { useState, useCallback, useEffect } from 'react';

interface UseDragProps {
  onDrag: (x: number, y: number) => void;
}

export function useDrag({ onDrag }: UseDragProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [elementStartPos, setElementStartPos] = useState({ x: 0, y: 0 });

  const onDragStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    
    const targetElement = e.currentTarget;
    const parent = targetElement.offsetParent as HTMLElement;
    
    // Position relative to parent
    const initialX = targetElement.offsetLeft;
    const initialY = targetElement.offsetTop;

    setStartPos({
      x: e.clientX,
      y: e.clientY,
    });
    setElementStartPos({
      x: initialX,
      y: initialY,
    });

    const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - e.clientX;
        const deltaY = moveEvent.clientY - e.clientY;
        const newX = initialX + deltaX;
        const newY = initialY + deltaY;
        onDrag(newX, newY);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [onDrag]);

  return { onDragStart, isDragging };
}
