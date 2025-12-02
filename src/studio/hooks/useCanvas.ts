
import { create } from 'zustand';

// Define the types for our elements
export type ElementType = 'text' | 'image' | 'shape';

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  opacity: number;
}

export interface ShapeElement extends BaseElement {
  type: 'shape';
  shapeType: 'rectangle' | 'circle';
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
}

export type CanvasElement = TextElement | ImageElement | ShapeElement;

// Define the state structure for our canvas
interface CanvasState {
  elements: CanvasElement[];
  selectedElementId: string | null;
  canvasSize: { width: number; height: number };
  
  addElement: (element: Omit<CanvasElement, 'id'>) => void;
  updateElement: (id: string, updatedProperties: Partial<CanvasElement>) => void;
  deleteElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  setCanvasSize: (size: { width: number; height: number }) => void;
}

// Create the Zustand store
export const useCanvas = create<CanvasState>((set) => ({
  elements: [],
  selectedElementId: null,
  canvasSize: { width: 816, height: 1056 }, // A4 at 96 DPI

  addElement: (element) => set((state) => ({
    elements: [...state.elements, { ...element, id: `el_${Date.now()}` } as CanvasElement]
  })),

  updateElement: (id, updatedProperties) => set((state) => ({
    elements: state.elements.map(el => el.id === id ? { ...el, ...updatedProperties } : el)
  })),

  deleteElement: (id) => set((state) => ({
    elements: state.elements.filter(el => el.id !== id),
    selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
  })),

  selectElement: (id) => set({ selectedElementId: id }),
  
  setCanvasSize: (size) => set({ canvasSize: size }),
}));
