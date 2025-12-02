
import { create } from 'zustand';

export interface CanvasElementProps {
    text?: string;
    fontSize?: number;
    color?: string;
    fontFamily?: string;
    src?: string;
    backgroundColor?: string;
    borderRadius?: string;
    clipPath?: string;
    borderBottom?: string;
    borderLeft?: string;
    borderRight?: string;
}

export interface CanvasElement {
    id: string;
    type: 'text' | 'image' | 'shape';
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    props: CanvasElementProps;
}

export interface Guide {
    id: string;
    y?: number;
    x?: number;
}

interface CanvasState {
  elements: CanvasElement[];
  selectedElementId: string | null;
  history: CanvasElement[][];
  historyIndex: number;
  zoom: number;
  canvasPosition: { x: number; y: number };
  rulers: { visible: boolean };
  guides: { horizontal: Guide[]; vertical: Guide[] };

  addElement: (element: Omit<CanvasElement, 'id'>) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  deleteElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  setZoom: (zoom: number) => void;
  setCanvasPosition: (position: { x: number; y: number }) => void;
  toggleRulers: () => void;
  addGuide: (orientation: 'horizontal' | 'vertical', position: number) => void;
  commitHistory: () => void;
  undo: () => void;
  redo: () => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  elements: [],
  selectedElementId: null,
  history: [[]],
  historyIndex: 0,
  zoom: 1,
  canvasPosition: { x: 0, y: 0 },
  rulers: { visible: false },
  guides: { horizontal: [], vertical: [] },

  addElement: (element) => {
    const newElement = { ...element, id: Date.now().toString() };
    set((state) => ({
      elements: [...state.elements, newElement],
    }));
    get().commitHistory();
  },

  updateElement: (id, updates) => {
    set((state) => ({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ),
    }));
  },

  deleteElement: (id) => {
    set((state) => ({
      elements: state.elements.filter((el) => el.id !== id),
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
    }));
    get().commitHistory();
  },

  selectElement: (id) => set({ selectedElementId: id }),
  
  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(3, zoom)) }),

  setCanvasPosition: (position) => set({ canvasPosition: position }),
  
  toggleRulers: () => set(state => ({ rulers: { ...state.rulers, visible: !state.rulers.visible } })),

  addGuide: (orientation, position) => {
    set(state => {
      const id = `guide-${orientation}-${Date.now()}`;
      if (orientation === 'horizontal') {
        return { guides: { ...state.guides, horizontal: [...state.guides.horizontal, { id, y: position }]}};
      } else {
        return { guides: { ...state.guides, vertical: [...state.guides.vertical, { id, x: position }]}};
      }
    });
  },

  commitHistory: () => {
    set(state => {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(state.elements);
      return {
        history: newHistory,
        historyIndex: newHistory.length - 1
      };
    });
  },

  undo: () => {
    set(state => {
      if (state.historyIndex > 0) {
        const newIndex = state.historyIndex - 1;
        return {
          elements: state.history[newIndex],
          historyIndex: newIndex,
          selectedElementId: null
        };
      }
      return {};
    });
  },

  redo: () => {
    set(state => {
      if (state.historyIndex < state.history.length - 1) {
        const newIndex = state.historyIndex + 1;
        return {
          elements: state.history[newIndex],
          historyIndex: newIndex,
          selectedElementId: null
        };
      }
      return {};
    });
  },
}));
