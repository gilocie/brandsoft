import { create } from 'zustand';

// ============ TYPES ============
export interface CanvasElementProps {
    // Text
    text?: string;
    fontSize?: number;
    color?: string;
    fontFamily?: string;
    fontWeight?: number;
    textAlign?: 'left' | 'center' | 'right';
    lineHeight?: number;
    letterSpacing?: number;

    // Image
    src?: string;
    objectFit?: 'cover' | 'contain' | 'fill' | 'none';

    // Shape fill
    backgroundColor?: string;
    fillOpacity?: number;
    clipPath?: string;

    // Individual border radius
    borderTopLeftRadius?: number;
    borderTopRightRadius?: number;
    borderBottomLeftRadius?: number;
    borderBottomRightRadius?: number;

    // Border
    borderColor?: string;
    borderWidth?: number;
    borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';

    // Triangle
    borderBottom?: string;
    borderLeft?: string;
    borderRight?: string;

    // Shadow
    shadowColor?: string;
    shadowBlur?: number;
    shadowOffsetX?: number;
    shadowOffsetY?: number;
    shadowSpread?: number;
    shadowInset?: boolean;

    // Effects
    opacity?: number;
    blur?: number;

    // Shape image
    shapeImage?: string;
    shapeImageFit?: 'cover' | 'contain' | 'fill';
    shapeImageOffsetX?: number;
    shapeImageOffsetY?: number;
    shapeImageScale?: number;

    // Template
    isTemplateField?: boolean;
    templateFieldType?: 'logo' | 'background' | 'header' | 'footer' | 'image' | 'text';
    templateFieldName?: string;
}

export interface CanvasElement {
    id: string;
    type: 'text' | 'image' | 'shape' | 'group';
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
    groupId?: string | null;
    childIds?: string[];
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

export interface SelectionBox {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    isSelecting: boolean;
}

// ============ DEFAULTS ============
const defaultBackground: BackgroundSettings = {
    opacity: 1, blur: 0, grayscale: 0, brightness: 100, contrast: 100, saturate: 100,
    objectFit: 'cover', objectPosition: 'center center', offsetX: 0, offsetY: 0, scale: 1,
};

const defaultPageDetails: PageDetails = {
    width: 8.5, height: 11, unit: 'in', backgroundColor: '#FFFFFF', background: { ...defaultBackground },
};

const defaultTemplateSettings: TemplateSettings = {
    isTemplate: false, templateName: '', templateDescription: '', editableFields: [],
};

// ============ STORE INTERFACE ============
interface CanvasState {
    elements: CanvasElement[];
    selectedElementId: string | null;
    selectedElementIds: string[];
    selectionBox: SelectionBox | null;
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

    // Element
    addElement: (element: Omit<CanvasElement, 'id'>, options?: { select?: boolean }) => void;
    updateElement: (id: string, updates: Partial<CanvasElement>) => void;
    updateElementProps: (id: string, props: Partial<CanvasElementProps>) => void;
    deleteElement: (id: string) => void;
    duplicateElement: (id: string) => void;
    selectElement: (id: string | null) => void;
    moveElement: (id: string, direction: 'up' | 'down' | 'left' | 'right', amount?: number) => void;

    // Multi-select
    selectMultipleElements: (ids: string[]) => void;
    addToSelection: (id: string) => void;
    removeFromSelection: (id: string) => void;
    clearSelection: () => void;
    setSelectionBox: (box: SelectionBox | null) => void;
    getElementsInSelectionBox: (box: SelectionBox) => string[];
    groupSelectedElements: () => void;
    ungroupElement: (groupId: string) => void;

    // Linking
    linkElements: (parentId: string, childId: string) => void;
    unlinkElement: (elementId: string) => void;
    getLinkedElements: (elementId: string) => CanvasElement[];
    linkSelectedElements: () => void;

    // Layers
    bringToFront: (id: string) => void;
    sendToBack: (id: string) => void;
    bringForward: (id: string) => void;
    sendBackward: (id: string) => void;

    // View
    setZoom: (zoom: number) => void;
    setCanvasPosition: (position: { x: number; y: number }) => void;
    toggleRulers: () => void;

    // Guides
    addGuide: (orientation: 'horizontal' | 'vertical', position: number) => void;
    updateGuide: (id: string, updates: Partial<Guide>) => void;
    deleteGuide: (id: string) => void;

    // Page
    updatePageDetails: (updates: Partial<PageDetails>) => void;
    updatePageBackground: (updates: Partial<BackgroundSettings>) => void;
    setBackgroundRepositioning: (isRepositioning: boolean) => void;

    // Template
    updateTemplateSettings: (updates: Partial<TemplateSettings>) => void;
    setTemplateEditMode: (isEditMode: boolean) => void;
    markAsTemplateField: (elementId: string, fieldType: CanvasElementProps['templateFieldType'], fieldName: string) => void;
    removeTemplateField: (elementId: string) => void;

    // History
    commitHistory: () => void;
    undo: () => void;
    redo: () => void;

    // Snapping
    getSnapPosition: (element: CanvasElement, newX: number, newY: number) => { x: number; y: number; snappedToId: string | null };
}

// ============ IMPLEMENTATION ============
let nextZIndex = 1;

export const useCanvasStore = create<CanvasState>((set, get) => ({
    elements: [],
    selectedElementId: null,
    selectedElementIds: [],
    selectionBox: null,
    pageDetails: { ...defaultPageDetails },
    history: [{ elements: [], pageDetails: { ...defaultPageDetails } }],
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
            props: { opacity: 1, fillOpacity: 1, ...element.props },
        };
        set((state) => ({
            elements: [...state.elements, newElement],
            selectedElementId: options?.select !== false ? newElement.id : state.selectedElementId,
            selectedElementIds: options?.select !== false ? [newElement.id] : state.selectedElementIds,
        }));
        get().commitHistory();
    },

    updateElement: (id, updates) => {
        const element = get().elements.find(el => el.id === id);
        if (!element) return;
        const deltaX = updates.x !== undefined ? updates.x - element.x : 0;
        const deltaY = updates.y !== undefined ? updates.y - element.y : 0;

        set((state) => ({
            elements: state.elements.map((el) => {
                if (el.id === id) return { ...el, ...updates };
                if (el.linkedElementId === id && (deltaX !== 0 || deltaY !== 0)) {
                    return { ...el, x: el.x + deltaX, y: el.y + deltaY };
                }
                if (el.groupId === id && (deltaX !== 0 || deltaY !== 0)) {
                    return { ...el, x: el.x + deltaX, y: el.y + deltaY };
                }
                return el;
            }),
        }));
    },

    updateElementProps: (id, props) => {
        set((state) => ({
            elements: state.elements.map((el) => el.id === id ? { ...el, props: { ...el.props, ...props } } : el),
        }));
    },

    deleteElement: (id) => {
        set((state) => {
            const element = state.elements.find(el => el.id === id);
            let elementsToDelete = [id];
            
            // If it's a group, delete all children
            if (element?.type === 'group' && element.childIds) {
                elementsToDelete = [...elementsToDelete, ...element.childIds];
            }

            return {
                elements: state.elements
                    .filter((el) => !elementsToDelete.includes(el.id))
                    .map(el => el.linkedElementId === id ? { ...el, linkedElementId: null, isLinkedChild: false } : el),
                selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
                selectedElementIds: state.selectedElementIds.filter(i => !elementsToDelete.includes(i)),
            };
        });
        get().commitHistory();
    },

    duplicateElement: (id) => {
        const element = get().elements.find(el => el.id === id);
        if (!element) return;
        const newElement = {
            ...element,
            id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            x: element.x + 20, y: element.y + 20, zIndex: nextZIndex++,
            linkedElementId: null, isLinkedChild: false, groupId: null,
            props: { ...element.props, isTemplateField: false, templateFieldType: undefined, templateFieldName: undefined },
        };
        set((state) => ({ elements: [...state.elements, newElement], selectedElementId: newElement.id, selectedElementIds: [newElement.id] }));
        get().commitHistory();
    },

    selectElement: (id) => set({ 
        selectedElementId: id, 
        selectedElementIds: id ? [id] : [] 
    }),

    moveElement: (id, direction, amount = 1) => {
        const element = get().elements.find(el => el.id === id);
        if (!element) return;
        const updates: Partial<CanvasElement> = {};
        switch (direction) {
            case 'up': updates.y = element.y - amount; break;
            case 'down': updates.y = element.y + amount; break;
            case 'left': updates.x = element.x - amount; break;
            case 'right': updates.x = element.x + amount; break;
        }
        get().updateElement(id, updates);
    },

    // Multi-select methods
    selectMultipleElements: (ids) => set({ 
        selectedElementIds: ids,
        selectedElementId: ids.length === 1 ? ids[0] : (ids.length > 0 ? ids[0] : null),
    }),

    addToSelection: (id) => set((state) => {
        if (state.selectedElementIds.includes(id)) return {};
        const newIds = [...state.selectedElementIds, id];
        return { 
            selectedElementIds: newIds,
            selectedElementId: newIds[0],
        };
    }),

    removeFromSelection: (id) => set((state) => {
        const newIds = state.selectedElementIds.filter(i => i !== id);
        return { 
            selectedElementIds: newIds,
            selectedElementId: newIds.length > 0 ? newIds[0] : null,
        };
    }),

    clearSelection: () => set({ selectedElementId: null, selectedElementIds: [] }),

    setSelectionBox: (box) => set({ selectionBox: box }),

    getElementsInSelectionBox: (box) => {
        const { elements } = get();
        const minX = Math.min(box.startX, box.endX);
        const maxX = Math.max(box.startX, box.endX);
        const minY = Math.min(box.startY, box.endY);
        const maxY = Math.max(box.startY, box.endY);

        return elements.filter(el => {
            const elRight = el.x + el.width;
            const elBottom = el.y + el.height;
            return el.x < maxX && elRight > minX && el.y < maxY && elBottom > minY;
        }).map(el => el.id);
    },

    groupSelectedElements: () => {
        const { selectedElementIds, elements } = get();
        if (selectedElementIds.length < 2) return;

        const selectedElements = elements.filter(el => selectedElementIds.includes(el.id));
        
        // Calculate bounding box
        const minX = Math.min(...selectedElements.map(el => el.x));
        const minY = Math.min(...selectedElements.map(el => el.y));
        const maxX = Math.max(...selectedElements.map(el => el.x + el.width));
        const maxY = Math.max(...selectedElements.map(el => el.y + el.height));

        const groupId = `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const groupElement: CanvasElement = {
            id: groupId,
            type: 'group',
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
            rotation: 0,
            props: { opacity: 1 },
            zIndex: nextZIndex++,
            childIds: selectedElementIds,
        };

        set((state) => ({
            elements: [
                ...state.elements.map(el => 
                    selectedElementIds.includes(el.id) 
                        ? { ...el, groupId, x: el.x - minX, y: el.y - minY }
                        : el
                ),
                groupElement
            ],
            selectedElementId: groupId,
            selectedElementIds: [groupId],
        }));
        get().commitHistory();
    },

    ungroupElement: (groupId) => {
        const { elements } = get();
        const group = elements.find(el => el.id === groupId);
        if (!group || group.type !== 'group' || !group.childIds) return;

        set((state) => ({
            elements: state.elements
                .filter(el => el.id !== groupId)
                .map(el => 
                    group.childIds!.includes(el.id)
                        ? { ...el, groupId: null, x: el.x + group.x, y: el.y + group.y }
                        : el
                ),
            selectedElementId: null,
            selectedElementIds: group.childIds!,
        }));
        get().commitHistory();
    },

    linkElements: (parentId, childId) => {
        set((state) => ({
            elements: state.elements.map(el =>
                el.id === childId ? { ...el, linkedElementId: parentId, isLinkedChild: true } : el
            ),
        }));
        get().commitHistory();
    },

    unlinkElement: (elementId) => {
        set((state) => ({
            elements: state.elements.map(el =>
                el.id === elementId ? { ...el, linkedElementId: null, isLinkedChild: false } : el
            ),
        }));
        get().commitHistory();
    },

    getLinkedElements: (elementId) => get().elements.filter(el => el.linkedElementId === elementId),

    linkSelectedElements: () => {
        const { selectedElementIds, elements } = get();
        if (selectedElementIds.length < 2) return;

        // Find the first shape to be the parent
        const selectedElements = elements.filter(el => selectedElementIds.includes(el.id));
        const parentElement = selectedElements.find(el => el.type === 'shape') || selectedElements[0];
        const childElements = selectedElements.filter(el => el.id !== parentElement.id);

        set((state) => ({
            elements: state.elements.map(el =>
                childElements.some(child => child.id === el.id)
                    ? { ...el, linkedElementId: parentElement.id, isLinkedChild: true }
                    : el
            ),
        }));
        get().commitHistory();
    },

    bringToFront: (id) => {
        set((state) => ({ elements: state.elements.map((el) => el.id === id ? { ...el, zIndex: nextZIndex++ } : el) }));
        get().commitHistory();
    },

    sendToBack: (id) => {
        set((state) => {
            const minZ = Math.min(...state.elements.map(el => el.zIndex || 0));
            return { elements: state.elements.map((el) => el.id === id ? { ...el, zIndex: minZ - 1 } : el) };
        });
        get().commitHistory();
    },

    bringForward: (id) => {
        set((state) => {
            const el = state.elements.find(e => e.id === id);
            if (!el) return {};
            const above = state.elements.filter(e => (e.zIndex || 0) > (el.zIndex || 0));
            if (!above.length) return {};
            const nextZ = Math.min(...above.map(e => e.zIndex || 0));
            return { elements: state.elements.map(e => e.id === id ? { ...e, zIndex: nextZ + 1 } : e) };
        });
        get().commitHistory();
    },

    sendBackward: (id) => {
        set((state) => {
            const el = state.elements.find(e => e.id === id);
            if (!el) return {};
            const below = state.elements.filter(e => (e.zIndex || 0) < (el.zIndex || 0));
            if (!below.length) return {};
            const prevZ = Math.max(...below.map(e => e.zIndex || 0));
            return { elements: state.elements.map(e => e.id === id ? { ...e, zIndex: prevZ - 1 } : e) };
        });
        get().commitHistory();
    },

    setZoom: (zoom) => set({ zoom }),
    setCanvasPosition: (position) => set({ canvasPosition: position }),
    toggleRulers: () => set((state) => ({ rulers: { ...state.rulers, visible: !state.rulers.visible } })),

    addGuide: (orientation, position) => {
        const id = `guide-${orientation}-${Date.now()}`;
        set((state) => ({
            guides: orientation === 'horizontal'
                ? { ...state.guides, horizontal: [...state.guides.horizontal, { id, y: position }] }
                : { ...state.guides, vertical: [...state.guides.vertical, { id, x: position }] },
        }));
    },

    updateGuide: (id, updates) => {
        set((state) => ({
            guides: {
                horizontal: state.guides.horizontal.map(g => g.id === id ? { ...g, ...updates } : g),
                vertical: state.guides.vertical.map(g => g.id === id ? { ...g, ...updates } : g),
            },
        }));
    },

    deleteGuide: (id) => {
        set((state) => ({
            guides: {
                horizontal: state.guides.horizontal.filter(g => g.id !== id),
                vertical: state.guides.vertical.filter(g => g.id !== id),
            },
        }));
    },

    updatePageDetails: (updates) => set((state) => ({ pageDetails: { ...state.pageDetails, ...updates } })),

    updatePageBackground: (updates) => {
        set((state) => ({ pageDetails: { ...state.pageDetails, background: { ...state.pageDetails.background, ...updates } } }));
    },

    setBackgroundRepositioning: (isRepositioning) => set({ isBackgroundRepositioning: isRepositioning }),

    updateTemplateSettings: (updates) => set((state) => ({ templateSettings: { ...state.templateSettings, ...updates } })),

    setTemplateEditMode: (isEditMode) => set({ isTemplateEditMode: isEditMode }),

    markAsTemplateField: (elementId, fieldType, fieldName) => {
        set((state) => ({
            elements: state.elements.map(el => el.id === elementId ? { ...el, props: { ...el.props, isTemplateField: true, templateFieldType: fieldType, templateFieldName: fieldName } } : el),
            templateSettings: { ...state.templateSettings, editableFields: [...new Set([...state.templateSettings.editableFields, elementId])] },
        }));
        get().commitHistory();
    },

    removeTemplateField: (elementId) => {
        set((state) => ({
            elements: state.elements.map(el => el.id === elementId ? { ...el, props: { ...el.props, isTemplateField: false, templateFieldType: undefined, templateFieldName: undefined } } : el),
            templateSettings: { ...state.templateSettings, editableFields: state.templateSettings.editableFields.filter(id => id !== elementId) },
        }));
        get().commitHistory();
    },

    commitHistory: () => {
        set((state) => {
            const newHistory = state.history.slice(0, state.historyIndex + 1);
            newHistory.push({ elements: JSON.parse(JSON.stringify(state.elements)), pageDetails: JSON.parse(JSON.stringify(state.pageDetails)) });
            return { history: newHistory, historyIndex: newHistory.length - 1 };
        });
    },

    undo: () => {
        set((state) => {
            if (state.historyIndex <= 0) return {};
            const prev = state.history[state.historyIndex - 1];
            return { elements: JSON.parse(JSON.stringify(prev.elements)), pageDetails: JSON.parse(JSON.stringify(prev.pageDetails)), historyIndex: state.historyIndex - 1, selectedElementId: null, selectedElementIds: [] };
        });
    },

    redo: () => {
        set((state) => {
            if (state.historyIndex >= state.history.length - 1) return {};
            const next = state.history[state.historyIndex + 1];
            return { elements: JSON.parse(JSON.stringify(next.elements)), pageDetails: JSON.parse(JSON.stringify(next.pageDetails)), historyIndex: state.historyIndex + 1, selectedElementId: null, selectedElementIds: [] };
        });
    },

    getSnapPosition: (element, newX, newY) => {
        const state = get();
        const SNAP = 10;
        let snappedX = newX, snappedY = newY, snappedToId: string | null = null;
        const eCX = newX + element.width / 2, eCY = newY + element.height / 2;
        const eR = newX + element.width, eB = newY + element.height;

        for (const other of state.elements) {
            if (other.id === element.id || other.linkedElementId === element.id || element.linkedElementId === other.id) continue;
            const oCX = other.x + other.width / 2, oCY = other.y + other.height / 2;
            const oR = other.x + other.width, oB = other.y + other.height;

            if (Math.abs(eCX - oCX) < SNAP) { snappedX = oCX - element.width / 2; snappedToId = other.id; }
            if (Math.abs(eCY - oCY) < SNAP) { snappedY = oCY - element.height / 2; snappedToId = other.id; }
            if (Math.abs(newX - other.x) < SNAP) { snappedX = other.x; snappedToId = other.id; }
            if (Math.abs(eR - oR) < SNAP) { snappedX = oR - element.width; snappedToId = other.id; }
            if (Math.abs(newY - other.y) < SNAP) { snappedY = other.y; snappedToId = other.id; }
            if (Math.abs(eB - oB) < SNAP) { snappedY = oB - element.height; snappedToId = other.id; }
            if (Math.abs(newX - oR) < SNAP) { snappedX = oR; snappedToId = other.id; }
            if (Math.abs(eR - other.x) < SNAP) { snappedX = other.x - element.width; snappedToId = other.id; }
            if (Math.abs(newY - oB) < SNAP) { snappedY = oB; snappedToId = other.id; }
            if (Math.abs(eB - other.y) < SNAP) { snappedY = other.y - element.height; snappedToId = other.id; }
        }
        return { x: snappedX, y: snappedY, snappedToId };
    },
}));
