import { create } from 'zustand';

export interface CanvasElementProps {
    text?: string;
    fontSize?: number;
    color?: string;
    fontFamily?: string;
    fontWeight?: number;
    src?: string;
    backgroundColor?: string;
    borderRadius?: string;
    clipPath?: string;
    borderBottom?: string;
    borderLeft?: string;
    borderRight?: string;
    borderColor?: string;
    borderWidth?: number;
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
    zIndex?: number;
}

export interface Guide {
    id: string;
    y?: number;
    x?: number;
}

export interface PageDetails {
    width: number;
    height: number;
    unit: 'in' | 'px' | 'cm';
    backgroundColor: string;
    backgroundImage?: string;
}

interface CanvasState {
    elements: CanvasElement[];
    selectedElementId: string | null;
    history: { elements: CanvasElement[]; pageDetails: PageDetails }[];
    historyIndex: number;
    zoom: number;
    canvasPosition: { x: number; y: number };
    rulers: { visible: boolean };
    guides: { horizontal: Guide[]; vertical: Guide[] };
    pageDetails: PageDetails;

    addElement: (element: Omit<CanvasElement, 'id'>, options?: { select?: boolean }) => void;
    updateElement: (id: string, updates: Partial<CanvasElement>) => void;
    updateElementProps: (id: string, props: Partial<CanvasElementProps>) => void;
    deleteElement: (id: string) => void;
    selectElement: (id: string | null) => void;
    bringToFront: (id: string) => void;
    sendToBack: (id: string) => void;
    setZoom: (zoom: number) => void;
    setCanvasPosition: (position: { x: number; y: number }) => void;
    toggleRulers: () => void;
    addGuide: (orientation: 'horizontal' | 'vertical', position: number) => void;
    updateGuide: (id: string, updates: Partial<Guide>) => void;
    deleteGuide: (id: string) => void;
    updatePageDetails: (updates: Partial<PageDetails>) => void;
    commitHistory: () => void;
    undo: () => void;
    redo: () => void;
}

let nextZIndex = 1;

export const useCanvasStore = create<CanvasState>((set, get) => ({
    elements: [],
    selectedElementId: null,
    pageDetails: {
        width: 8.5,
        height: 11,
        unit: 'in',
        backgroundColor: '#FFFFFF',
    },
    history: [{ elements: [], pageDetails: { width: 8.5, height: 11, unit: 'in', backgroundColor: '#FFFFFF' } }],
    historyIndex: 0,
    zoom: 1,
    canvasPosition: { x: 0, y: 0 },
    rulers: { visible: true },
    guides: { horizontal: [], vertical: [] },

    addElement: (element, options) => {
        const newElement = { 
            ...element, 
            id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            zIndex: nextZIndex++
        };
        set((state) => ({
            elements: [...state.elements, newElement],
            selectedElementId: options?.select !== false ? newElement.id : state.selectedElementId,
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

    updateElementProps: (id, props) => {
        set((state) => ({
            elements: state.elements.map((el) =>
                el.id === id ? { ...el, props: { ...el.props, ...props } } : el
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

    bringToFront: (id) => {
        set((state) => ({
            elements: state.elements.map((el) =>
                el.id === id ? { ...el, zIndex: nextZIndex++ } : el
            ),
        }));
    },

    sendToBack: (id) => {
        set((state) => {
            const minZIndex = Math.min(...state.elements.map(el => el.zIndex || 0));
            return {
                elements: state.elements.map((el) =>
                    el.id === id ? { ...el, zIndex: minZIndex - 1 } : el
                ),
            };
        });
    },

    setZoom: (zoom) => set({ zoom }),

    setCanvasPosition: (position) => set({ canvasPosition: position }),

    toggleRulers: () => set(state => ({ rulers: { ...state.rulers, visible: !state.rulers.visible } })),

    addGuide: (orientation, position) => {
        set(state => {
            const id = `guide-${orientation}-${Date.now()}`;
            if (orientation === 'horizontal') {
                return { guides: { ...state.guides, horizontal: [...state.guides.horizontal, { id, y: position }] } };
            } else {
                return { guides: { ...state.guides, vertical: [...state.guides.vertical, { id, x: position }] } };
            }
        });
    },

    updateGuide: (id, updates) => {
        set((state) => ({
            guides: {
                horizontal: state.guides.horizontal.map(g => g.id === id ? { ...g, ...updates } : g),
                vertical: state.guides.vertical.map(g => g.id === id ? { ...g, ...updates } : g),
            }
        }));
    },

    deleteGuide: (id) => {
        set(state => ({
            guides: {
                horizontal: state.guides.horizontal.filter(g => g.id !== id),
                vertical: state.guides.vertical.filter(g => g.id !== id),
            }
        }));
    },

    updatePageDetails: (updates) => {
        set(state => ({
            pageDetails: { ...state.pageDetails, ...updates }
        }));
    },

    commitHistory: () => {
        set(state => {
            const newHistory = state.history.slice(0, state.historyIndex + 1);
            newHistory.push({ 
                elements: JSON.parse(JSON.stringify(state.elements)), 
                pageDetails: { ...state.pageDetails } 
            });
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
                const previousState = state.history[newIndex];
                return {
                    elements: JSON.parse(JSON.stringify(previousState.elements)),
                    pageDetails: { ...previousState.pageDetails },
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
                const nextState = state.history[newIndex];
                return {
                    elements: JSON.parse(JSON.stringify(nextState.elements)),
                    pageDetails: { ...nextState.pageDetails },
                    historyIndex: newIndex,
                    selectedElementId: null
                };
            }
            return {};
        });
    },
}));