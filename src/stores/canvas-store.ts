import { create } from 'zustand';

export interface CanvasElementProps {
    // Text properties
    text?: string;
    fontSize?: number;
    color?: string;
    fontFamily?: string;
    fontWeight?: number;
    textAlign?: 'left' | 'center' | 'right';
    lineHeight?: number;
    letterSpacing?: number;

    // Image properties
    src?: string;
    objectFit?: 'cover' | 'contain' | 'fill' | 'none';

    // Shape properties
    backgroundColor?: string;
    fillOpacity?: number;
    clipPath?: string;

    // Individual border radius (for single-side control)
    borderTopLeftRadius?: number;
    borderTopRightRadius?: number;
    borderBottomLeftRadius?: number;
    borderBottomRightRadius?: number;
    borderRadius?: string; // Legacy support

    // Border/Outline properties
    borderColor?: string;
    borderWidth?: number;
    borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';

    // Triangle specific
    borderBottom?: string;
    borderLeft?: string;
    borderRight?: string;

    // Shadow properties
    shadowColor?: string;
    shadowBlur?: number;
    shadowOffsetX?: number;
    shadowOffsetY?: number;
    shadowSpread?: number;
    shadowInset?: boolean;

    // Effects
    opacity?: number;
    blur?: number;

    // Shape with image
    shapeImage?: string;
    shapeImageFit?: 'cover' | 'contain' | 'fill';
    shapeImageOffsetX?: number;
    shapeImageOffsetY?: number;
    shapeImageScale?: number;

    // Template properties
    isTemplateField?: boolean;
    templateFieldType?: 'logo' | 'background' | 'header' | 'footer' | 'image' | 'text';
    templateFieldName?: string;
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
    locked?: boolean;
    linkedElementId?: string | null;
    isLinkedChild?: boolean;
}

export interface Guide {
    id: string;
    y?: number;
    x?: number;
}

export interface BackgroundSettings {
    image?: string;
    opacity: number;
    blur: number;
    grayscale: number;
    brightness: number;
    contrast: number;
    saturate: number;
    objectFit: 'cover' | 'contain' | 'fill' | 'none';
    objectPosition: string;
    offsetX: number;
    offsetY: number;
    scale: number;
}

export interface PageDetails {
    width: number;
    height: number;
    unit: 'in' | 'px' | 'cm';
    backgroundColor: string;
    background: BackgroundSettings;
}

export interface TemplateSettings {
    isTemplate: boolean;
    templateName: string;
    templateDescription: string;
    editableFields: string[];
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
    templateSettings: TemplateSettings;
    isBackgroundRepositioning: boolean;
    isTemplateEditMode: boolean;

    // Element actions
    addElement: (element: Omit<CanvasElement, 'id'>, options?: { select?: boolean }) => void;
    updateElement: (id: string, updates: Partial<CanvasElement>) => void;
    updateElementProps: (id: string, props: Partial<CanvasElementProps>) => void;
    deleteElement: (id: string) => void;
    duplicateElement: (id: string) => void;
    selectElement: (id: string | null) => void;

    // Linking
    linkElements: (parentId: string, childId: string) => void;
    unlinkElement: (elementId: string) => void;
    getLinkedElements: (elementId: string) => CanvasElement[];

    // Layer actions
    bringToFront: (id: string) => void;
    sendToBack: (id: string) => void;
    bringForward: (id: string) => void;
    sendBackward: (id: string) => void;

    // View actions
    setZoom: (zoom: number) => void;
    setCanvasPosition: (position: { x: number; y: number }) => void;
    toggleRulers: () => void;

    // Guide actions
    addGuide: (orientation: 'horizontal' | 'vertical', position: number) => void;
    updateGuide: (id: string, updates: Partial<Guide>) => void;
    deleteGuide: (id: string) => void;

    // Page actions
    updatePageDetails: (updates: Partial<PageDetails>) => void;
    updatePageBackground: (updates: Partial<BackgroundSettings>) => void;
    setBackgroundRepositioning: (isRepositioning: boolean) => void;

    // Template actions
    updateTemplateSettings: (updates: Partial<TemplateSettings>) => void;
    setTemplateEditMode: (isEditMode: boolean) => void;
    markAsTemplateField: (elementId: string, fieldType: CanvasElementProps['templateFieldType'], fieldName: string) => void;
    removeTemplateField: (elementId: string) => void;

    // History actions
    commitHistory: () => void;
    undo: () => void;
    redo: () => void;

    // Snapping
    getSnapPosition: (element: CanvasElement, newX: number, newY: number) => { x: number; y: number; snappedToId: string | null };
}

let nextZIndex = 1;

const defaultBackground: BackgroundSettings = {
    opacity: 1,
    blur: 0,
    grayscale: 0,
    brightness: 100,
    contrast: 100,
    saturate: 100,
    objectFit: 'cover',
    objectPosition: 'center center',
    offsetX: 0,
    offsetY: 0,
    scale: 1,
};

const defaultTemplateSettings: TemplateSettings = {
    isTemplate: false,
    templateName: '',
    templateDescription: '',
    editableFields: [],
};

export const useCanvasStore = create<CanvasState>((set, get) => ({
    elements: [],
    selectedElementId: null,
    pageDetails: {
        width: 8.5,
        height: 11,
        unit: 'in',
        backgroundColor: '#FFFFFF',
        background: { ...defaultBackground },
    },
    history: [{
        elements: [],
        pageDetails: {
            width: 8.5,
            height: 11,
            unit: 'in',
            backgroundColor: '#FFFFFF',
            background: { ...defaultBackground },
        }
    }],
    historyIndex: 0,
    zoom: 1,
    canvasPosition: { x: 0, y: 0 },
    rulers: { visible: true },
    guides: { horizontal: [], vertical: [] },
    templateSettings: { ...defaultTemplateSettings },
    isBackgroundRepositioning: false,
    isTemplateEditMode: false,

    addElement: (element, options) => {
        const newElement = {
            ...element,
            id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            zIndex: nextZIndex++,
            props: {
                opacity: 1,
                fillOpacity: 1,
                ...element.props,
            }
        };
        set((state) => ({
            elements: [...state.elements, newElement],
            selectedElementId: options?.select !== false ? newElement.id : state.selectedElementId,
        }));
        get().commitHistory();
    },

    updateElement: (id, updates) => {
        const state = get();
        const element = state.elements.find(el => el.id === id);
        if (!element) return;

        // Calculate position delta for linked elements
        const deltaX = updates.x !== undefined ? updates.x - element.x : 0;
        const deltaY = updates.y !== undefined ? updates.y - element.y : 0;

        set((state) => ({
            elements: state.elements.map((el) => {
                if (el.id === id) {
                    return { ...el, ...updates };
                }
                // Move linked children with parent
                if (el.linkedElementId === id && (deltaX !== 0 || deltaY !== 0)) {
                    return { ...el, x: el.x + deltaX, y: el.y + deltaY };
                }
                return el;
            }),
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
        set((state) => {
            const updatedElements = state.elements
                .filter((el) => el.id !== id)
                .map(el => el.linkedElementId === id ? { ...el, linkedElementId: null, isLinkedChild: false } : el);

            return {
                elements: updatedElements,
                selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
            };
        });
        get().commitHistory();
    },

    duplicateElement: (id) => {
        const state = get();
        const element = state.elements.find(el => el.id === id);
        if (element) {
            const newElement = {
                ...element,
                id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                x: element.x + 20,
                y: element.y + 20,
                zIndex: nextZIndex++,
                linkedElementId: null,
                isLinkedChild: false,
                props: { ...element.props, isTemplateField: false, templateFieldType: undefined, templateFieldName: undefined }
            };
            set((state) => ({
                elements: [...state.elements, newElement],
                selectedElementId: newElement.id,
            }));
            get().commitHistory();
        }
    },

    selectElement: (id) => set({ selectedElementId: id }),

    linkElements: (parentId, childId) => {
        set((state) => ({
            elements: state.elements.map(el => {
                if (el.id === childId) {
                    return { ...el, linkedElementId: parentId, isLinkedChild: true };
                }
                return el;
            })
        }));
        get().commitHistory();
    },

    unlinkElement: (elementId) => {
        set((state) => ({
            elements: state.elements.map(el => {
                if (el.id === elementId) {
                    return { ...el, linkedElementId: null, isLinkedChild: false };
                }
                return el;
            })
        }));
        get().commitHistory();
    },

    getLinkedElements: (elementId) => {
        const state = get();
        return state.elements.filter(el => el.linkedElementId === elementId);
    },

    bringToFront: (id) => {
        set((state) => ({
            elements: state.elements.map((el) =>
                el.id === id ? { ...el, zIndex: nextZIndex++ } : el
            ),
        }));
        get().commitHistory();
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
        get().commitHistory();
    },

    bringForward: (id) => {
        set((state) => {
            const element = state.elements.find(el => el.id === id);
            if (!element) return {};

            const currentZ = element.zIndex || 0;
            const elementsAbove = state.elements.filter(el => (el.zIndex || 0) > currentZ);

            if (elementsAbove.length === 0) return {};

            const nextZ = Math.min(...elementsAbove.map(el => el.zIndex || 0));

            return {
                elements: state.elements.map((el) => {
                    if (el.id === id) return { ...el, zIndex: nextZ + 1 };
                    return el;
                }),
            };
        });
        get().commitHistory();
    },

    sendBackward: (id) => {
        set((state) => {
            const element = state.elements.find(el => el.id === id);
            if (!element) return {};

            const currentZ = element.zIndex || 0;
            const elementsBelow = state.elements.filter(el => (el.zIndex || 0) < currentZ);

            if (elementsBelow.length === 0) return {};

            const prevZ = Math.max(...elementsBelow.map(el => el.zIndex || 0));

            return {
                elements: state.elements.map((el) => {
                    if (el.id === id) return { ...el, zIndex: prevZ - 1 };
                    return el;
                }),
            };
        });
        get().commitHistory();
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

    updatePageBackground: (updates) => {
        set(state => ({
            pageDetails: {
                ...state.pageDetails,
                background: { ...state.pageDetails.background, ...updates }
            }
        }));
    },

    setBackgroundRepositioning: (isRepositioning) => {
        set({ isBackgroundRepositioning: isRepositioning });
    },

    updateTemplateSettings: (updates) => {
        set(state => ({
            templateSettings: { ...state.templateSettings, ...updates }
        }));
    },

    setTemplateEditMode: (isEditMode) => {
        set({ isTemplateEditMode: isEditMode });
    },

    markAsTemplateField: (elementId, fieldType, fieldName) => {
        set((state) => ({
            elements: state.elements.map(el =>
                el.id === elementId
                    ? { ...el, props: { ...el.props, isTemplateField: true, templateFieldType: fieldType, templateFieldName: fieldName } }
                    : el
            ),
            templateSettings: {
                ...state.templateSettings,
                editableFields: [...new Set([...state.templateSettings.editableFields, elementId])]
            }
        }));
        get().commitHistory();
    },

    removeTemplateField: (elementId) => {
        set((state) => ({
            elements: state.elements.map(el =>
                el.id === elementId
                    ? { ...el, props: { ...el.props, isTemplateField: false, templateFieldType: undefined, templateFieldName: undefined } }
                    : el
            ),
            templateSettings: {
                ...state.templateSettings,
                editableFields: state.templateSettings.editableFields.filter(id => id !== elementId)
            }
        }));
        get().commitHistory();
    },

    commitHistory: () => {
        set(state => {
            const newHistory = state.history.slice(0, state.historyIndex + 1);
            newHistory.push({
                elements: JSON.parse(JSON.stringify(state.elements)),
                pageDetails: JSON.parse(JSON.stringify(state.pageDetails))
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
                    pageDetails: JSON.parse(JSON.stringify(previousState.pageDetails)),
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
                    pageDetails: JSON.parse(JSON.stringify(nextState.pageDetails)),
                    historyIndex: newIndex,
                    selectedElementId: null
                };
            }
            return {};
        });
    },

    getSnapPosition: (element, newX, newY) => {
        const state = get();
        const SNAP_THRESHOLD = 10;
        let snappedX = newX;
        let snappedY = newY;
        let snappedToId: string | null = null;

        const elementCenterX = newX + element.width / 2;
        const elementCenterY = newY + element.height / 2;
        const elementRight = newX + element.width;
        const elementBottom = newY + element.height;

        for (const other of state.elements) {
            if (other.id === element.id || other.linkedElementId === element.id || element.linkedElementId === other.id) continue;

            const otherCenterX = other.x + other.width / 2;
            const otherCenterY = other.y + other.height / 2;
            const otherRight = other.x + other.width;
            const otherBottom = other.y + other.height;

            // Center alignment
            if (Math.abs(elementCenterX - otherCenterX) < SNAP_THRESHOLD) {
                snappedX = otherCenterX - element.width / 2;
                snappedToId = other.id;
            }
            if (Math.abs(elementCenterY - otherCenterY) < SNAP_THRESHOLD) {
                snappedY = otherCenterY - element.height / 2;
                snappedToId = other.id;
            }

            // Edge alignment
            if (Math.abs(newX - other.x) < SNAP_THRESHOLD) { snappedX = other.x; snappedToId = other.id; }
            if (Math.abs(elementRight - otherRight) < SNAP_THRESHOLD) { snappedX = otherRight - element.width; snappedToId = other.id; }
            if (Math.abs(newY - other.y) < SNAP_THRESHOLD) { snappedY = other.y; snappedToId = other.id; }
            if (Math.abs(elementBottom - otherBottom) < SNAP_THRESHOLD) { snappedY = otherBottom - element.height; snappedToId = other.id; }

            // Adjacent alignment
            if (Math.abs(newX - otherRight) < SNAP_THRESHOLD) { snappedX = otherRight; snappedToId = other.id; }
            if (Math.abs(elementRight - other.x) < SNAP_THRESHOLD) { snappedX = other.x - element.width; snappedToId = other.id; }
            if (Math.abs(newY - otherBottom) < SNAP_THRESHOLD) { snappedY = otherBottom; snappedToId = other.id; }
            if (Math.abs(elementBottom - other.y) < SNAP_THRESHOLD) { snappedY = other.y - element.height; snappedToId = other.id; }
        }

        return { x: snappedX, y: snappedY, snappedToId };
    },
}));