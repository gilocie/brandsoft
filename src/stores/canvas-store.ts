
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
    fillType?: 'solid' | 'gradient' | 'transparent';
    backgroundColor?: string;
    gradientAngle?: number;
    gradientStops?: GradientStop[];
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

export interface GradientStop {
    color: string;
    position: number; // 0 to 100
}

export interface PageDetails {
    width: number;
    height: number;
    unit: 'in' | 'px' | 'cm';
    ppi: number;
    orientation: 'portrait' | 'landscape';
    colorMode: 'RGB' | 'CMYK' | 'Grayscale';
    bitDepth: '8' | '16' | '32';

    backgroundType: 'color' | 'transparent' | 'gradient';
    backgroundColor: string;
    gradientAngle: number;
    gradientStops: GradientStop[];

    background: BackgroundSettings;
}

export interface Page {
    id: string;
    name: string;
    elements: CanvasElement[];
    pageDetails: PageDetails;
}

export interface BrandsoftTemplate {
  id: string;
  name: string;
  description?: string;
  category: 'invoice' | 'quotation' | 'certificate' | 'id-card' | 'marketing';
  pages: Page[];
  previewImage?: string; // data URL
  createdAt?: string;
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
    width: 8.5, height: 11, unit: 'in', ppi: 300, orientation: 'portrait',
    colorMode: 'RGB', bitDepth: '8', backgroundType: 'color', backgroundColor: '#FFFFFF',
    gradientAngle: 90,
    gradientStops: [
        { color: '#FFFFFF', position: 0 },
        { color: '#000000', position: 100 },
    ],
    background: { ...defaultBackground },
};

const defaultPage: Page = {
    id: `page-${Date.now()}`,
    name: 'Page 1',
    elements: [],
    pageDetails: defaultPageDetails,
};

const defaultTemplateSettings: TemplateSettings = {
    isTemplate: false, templateName: '', templateDescription: '', editableFields: [],
};

// ============ STORE INTERFACE ============
interface CanvasState {
    pages: Page[];
    currentPageIndex: number;
    selectedElementId: string | null;
    selectedElementIds: string[];
    selectionBox: SelectionBox | null;
    history: { pages: Page[], currentPageIndex: number }[];
    historyIndex: number;
    zoom: number;
    canvasPosition: { x: number; y: number };
    rulers: { visible: boolean };
    guides: { horizontal: Guide[]; vertical: Guide[] };
    templateSettings: TemplateSettings;
    isBackgroundRepositioning: boolean;
    isTemplateEditMode: boolean;
    isNewPageDialogOpen: boolean;

    // Element
    addElement: (element: Omit<CanvasElement, 'id'>, options?: { select?: boolean }) => void;
    updateElement: (id: string, updates: Partial<CanvasElement>) => void;
    updateElementProps: (id: string, props: Partial<CanvasElementProps>) => void;
    deleteElement: (id: string) => void;
    duplicateElement: (id: string) => void;
    selectElement: (id: string | null) => void;
    moveElement: (id: string, direction: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight', amount?: number) => void;

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
    
    // Multi-page
    addPage: () => void;
    setPages: (pages: Page[]) => void;
    setActivePage: (index: number) => void;
    deletePage: (index: number) => void;
    duplicatePage: (index: number) => void;
    movePage: (fromIndex: number, toIndex: number) => void;
    setNewPageDialogOpen: (isOpen: boolean) => void;

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

export const getBackgroundStyle = (props: CanvasElementProps | PageDetails) => {
    const fillType = 'fillType' in props ? props.fillType : ('backgroundType' in props ? props.backgroundType : 'solid');
    
    if (fillType === 'transparent') {
        return {
            backgroundImage: `
                linear-gradient(45deg, #ccc 25%, transparent 25%), 
                linear-gradient(135deg, #ccc 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #ccc 75%),
                linear-gradient(135deg, transparent 75%, #ccc 75%)`,
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 10px 0, 10px -10px, 0px 10px',
        };
    }
    if (fillType === 'gradient') {
        const stops = props.gradientStops || [];
        if (stops.length === 0) return { background: props.backgroundColor || '#FFFFFF' };
        const sortedStops = [...stops].sort((a, b) => a.position - b.position);
        const colorStops = sortedStops.map(s => `${s.color} ${s.position}%`).join(', ');
        return { background: `linear-gradient(${props.gradientAngle || 90}deg, ${colorStops})` };
    }
    return { background: props.backgroundColor };
};


export const getBackgroundCSS = (pageDetails: PageDetails) => {
    if (!pageDetails) return {};
    return getBackgroundStyle(pageDetails);
};


export const useCanvasStore = create<CanvasState>()(
    persist(
        (set, get) => ({
            pages: [],
            currentPageIndex: -1,
            selectedElementId: null,
            selectedElementIds: [],
            selectionBox: null,
            history: [],
            historyIndex: -1,
            zoom: 1,
            canvasPosition: { x: 0, y: 0 },
            rulers: { visible: true },
            guides: { horizontal: [], vertical: [] },
            templateSettings: { ...defaultTemplateSettings },
            isBackgroundRepositioning: false,
            isTemplateEditMode: false,
            isNewPageDialogOpen: true,

            addElement: (element, options) => {
                const newElement = {
                    ...element,
                    id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    zIndex: nextZIndex++,
                    props: { 
                        opacity: 1, 
                        fillOpacity: 1, 
                        fillType: 'solid' as 'solid' | 'gradient' | 'transparent',
                        gradientAngle: 90, 
                        gradientStops: [
                            { color: '#cccccc', position: 0 },
                            { color: '#333333', position: 100 },
                        ],
                        ...element.props 
                    },
                };
                set((state) => {
                    const newPages = [...state.pages];
                    const currentPage = newPages[state.currentPageIndex];
                    if(currentPage) {
                         currentPage.elements.push(newElement);
                    }
                    return {
                        pages: newPages,
                        selectedElementId: options?.select !== false ? newElement.id : state.selectedElementId,
                        selectedElementIds: options?.select !== false ? [newElement.id] : state.selectedElementIds,
                    };
                });
                get().commitHistory();
            },

            updateElement: (id, updates) => {
                const pages = get().pages;
                const pageIndex = pages.findIndex(p => p.elements.some(e => e.id === id));
                if (pageIndex === -1) return;

                const element = pages[pageIndex].elements.find(el => el.id === id);
                if (!element) return;

                const deltaX = updates.x !== undefined ? updates.x - element.x : 0;
                const deltaY = updates.y !== undefined ? updates.y - element.y : 0;

                set((state) => ({
                    pages: state.pages.map((p, i) => {
                        if (i !== pageIndex) return p;
                        return {
                            ...p,
                            elements: p.elements.map((el) => {
                                if (el.id === id) return { ...el, ...updates };
                                if (el.linkedElementId === id && (deltaX !== 0 || deltaY !== 0)) {
                                    return { ...el, x: el.x + deltaX, y: el.y + deltaY };
                                }
                                if (el.groupId === id && (deltaX !== 0 || deltaY !== 0)) {
                                    return { ...el, x: el.x + deltaX, y: el.y + deltaY };
                                }
                                return el;
                            })
                        };
                    }),
                }));
            },
            
            updateElementProps: (id, props) => {
                set((state) => ({
                    pages: state.pages.map(p => ({
                        ...p,
                        elements: p.elements.map((el) => el.id === id ? { ...el, props: { ...el.props, ...props } } : el),
                    }))
                }));
            },

            deleteElement: (id) => {
                set((state) => {
                    const pageIndex = state.pages.findIndex(p => p.elements.some(e => e.id === id));
                    if (pageIndex === -1) return state;

                    const element = state.pages[pageIndex].elements.find(el => el.id === id);
                    let elementsToDelete = [id];
                    
                    if (element?.type === 'group' && element.childIds) {
                        elementsToDelete = [...elementsToDelete, ...element.childIds];
                    }
                    
                    const newPages = state.pages.map((p, i) => {
                        if (i !== pageIndex) return p;
                        return {
                            ...p,
                            elements: p.elements
                                .filter((el) => !elementsToDelete.includes(el.id))
                                .map(el => el.linkedElementId === id ? { ...el, linkedElementId: null, isLinkedChild: false } : el)
                        };
                    });

                    return {
                        pages: newPages,
                        selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
                        selectedElementIds: state.selectedElementIds.filter(i => !elementsToDelete.includes(i)),
                    };
                });
                get().commitHistory();
            },

            duplicateElement: (id) => {
                const pages = get().pages;
                const pageIndex = pages.findIndex(p => p.elements.some(e => e.id === id));
                if (pageIndex === -1) return;

                const element = pages[pageIndex].elements.find(el => el.id === id);
                if (!element) return;

                const newElement: CanvasElement = {
                    ...element,
                    id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    x: element.x + 20,
                    y: element.y + 20,
                    zIndex: nextZIndex++,
                    linkedElementId: null,
                    isLinkedChild: false,
                    groupId: null,
                    props: {
                        ...element.props,
                        isTemplateField: false,
                        templateFieldType: undefined,
                        templateFieldName: undefined,
                    },
                };
                
                set((state) => {
                    const newPages = [...state.pages];
                    newPages[pageIndex].elements.push(newElement);
                    return {
                        pages: newPages,
                        selectedElementId: newElement.id,
                        selectedElementIds: [newElement.id],
                    };
                });
                get().commitHistory();
            },
            
            selectElement: (id) => set({
                selectedElementId: id,
                selectedElementIds: id ? [id] : [],
            }),
            
            moveElement: (id, direction, amount = 1) => {
                const pageIndex = get().pages.findIndex(p => p.elements.some(e => e.id === id));
                if (pageIndex === -1) return;
                const element = get().pages[pageIndex].elements.find(el => el.id === id);
                if (!element) return;
                const updates: Partial<CanvasElement> = {};
                switch (direction) {
                    case 'ArrowUp': updates.y = element.y - amount; break;
                    case 'ArrowDown': updates.y = element.y + amount; break;
                    case 'ArrowLeft': updates.x = element.x - amount; break;
                    case 'ArrowRight': updates.x = element.x + amount; break;
                }
                get().updateElement(id, updates);
            },

            selectMultipleElements: (ids) => set({
                selectedElementIds: ids,
                selectedElementId: ids.length > 0 ? ids[0] : null,
            }),

            addToSelection: (id) => set((state) => {
                if (state.selectedElementIds.includes(id)) return {};
                const newIds = [...state.selectedElementIds, id];
                return {
                    selectedElementIds: newIds,
                    selectedElementId: newIds.length === 1 ? newIds[0] : (newIds.length > 0 ? newIds[0] : null),
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
                const { pages, currentPageIndex } = get();
                if (!pages[currentPageIndex]) return [];
                const elements = pages[currentPageIndex].elements;
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
                const { selectedElementIds, pages, currentPageIndex } = get();
                if (selectedElementIds.length < 2) return;

                const currentPage = pages[currentPageIndex];
                const selectedElements = currentPage.elements.filter(el => selectedElementIds.includes(el.id));
                
                const minX = Math.min(...selectedElements.map(el => el.x));
                const minY = Math.min(...selectedElements.map(el => el.y));
                const maxX = Math.max(...selectedElements.map(el => el.x + el.width));
                const maxY = Math.max(...selectedElements.map(el => el.y + el.height));

                const groupId = `group-${Date.now()}`;
                const groupElement: CanvasElement = {
                    id: groupId, type: 'group', x: minX, y: minY, width: maxX - minX, height: maxY - minY, rotation: 0,
                    props: { opacity: 1 }, zIndex: nextZIndex++, childIds: selectedElementIds,
                };

                set((state) => {
                    const newPages = [...state.pages];
                    const page = newPages[state.currentPageIndex];
                    page.elements = page.elements.map(el => selectedElementIds.includes(el.id) ? { ...el, groupId, x: el.x - minX, y: el.y - minY } : el);
                    page.elements.push(groupElement);
                    return {
                        pages: newPages,
                        selectedElementId: groupId,
                        selectedElementIds: [groupId],
                    };
                });
                get().commitHistory();
            },

            ungroupElement: (groupId) => {
                const { pages, currentPageIndex } = get();
                const currentPage = pages[currentPageIndex];
                const group = currentPage.elements.find(el => el.id === groupId);
                if (!group || group.type !== 'group' || !group.childIds) return;

                set((state) => {
                    const newPages = [...state.pages];
                    const page = newPages[state.currentPageIndex];
                    page.elements = page.elements
                        .filter(el => el.id !== groupId)
                        .map(el => group.childIds!.includes(el.id) ? { ...el, groupId: null, x: el.x + group.x, y: el.y + group.y } : el);
                    
                    return {
                        pages: newPages,
                        selectedElementId: null,
                        selectedElementIds: group.childIds!,
                    };
                });
                get().commitHistory();
            },
            
            linkElements: (parentId, childId) => {
                set((state) => ({
                    pages: state.pages.map(p => ({
                        ...p,
                        elements: p.elements.map(el =>
                            el.id === childId ? { ...el, linkedElementId: parentId, isLinkedChild: true } : el
                        )
                    }))
                }));
                get().commitHistory();
            },

            unlinkElement: (elementId) => {
                set((state) => ({
                    pages: state.pages.map(p => ({
                        ...p,
                        elements: p.elements.map(el =>
                            el.id === elementId ? { ...el, linkedElementId: null, isLinkedChild: false } : el
                        )
                    }))
                }));
                get().commitHistory();
            },
            
            getLinkedElements: (elementId) => get().pages.flatMap(p => p.elements.filter(el => el.linkedElementId === elementId)),

            linkSelectedElements: () => {
                const { selectedElementIds, pages, currentPageIndex } = get();
                if (selectedElementIds.length < 2) return;

                const currentPage = pages[currentPageIndex];
                const selectedElements = currentPage.elements.filter(el => selectedElementIds.includes(el.id));
                const parentElement = selectedElements.find(el => el.type === 'shape') || selectedElements[0];
                const childElements = selectedElements.filter(el => el.id !== parentElement.id);

                set((state) => {
                    const newPages = [...state.pages];
                    const page = newPages[state.currentPageIndex];
                    page.elements = page.elements.map(el =>
                        childElements.some(child => child.id === el.id)
                            ? { ...el, linkedElementId: parentElement.id, isLinkedChild: true }
                            : el
                    );
                    return { pages: newPages };
                });
                get().commitHistory();
            },

            bringToFront: (id) => {
                set((state) => ({
                    pages: state.pages.map(p => ({
                        ...p,
                        elements: p.elements.map((el) => el.id === id ? { ...el, zIndex: nextZIndex++ } : el)
                    }))
                }));
                get().commitHistory();
            },

            sendToBack: (id) => {
                set((state) => {
                    const minZ = Math.min(...state.pages.flatMap(p => p.elements).map(el => el.zIndex || 0));
                    return {
                        pages: state.pages.map(p => ({
                            ...p,
                            elements: p.elements.map((el) => el.id === id ? { ...el, zIndex: minZ - 1 } : el)
                        }))
                    };
                });
                get().commitHistory();
            },

            bringForward: (id) => {
                set((state) => {
                    const allElements = state.pages.flatMap(p => p.elements);
                    const el = allElements.find(e => e.id === id);
                    if (!el) return {};
                    const above = allElements.filter(e => (e.zIndex || 0) > (el.zIndex || 0));
                    if (!above.length) return {};
                    const nextZ = Math.min(...above.map(e => e.zIndex || 0));
                    return {
                        pages: state.pages.map(p => ({
                            ...p,
                            elements: p.elements.map(e => e.id === id ? { ...e, zIndex: nextZ + 1 } : e)
                        }))
                    };
                });
                get().commitHistory();
            },
            
            sendBackward: (id) => {
                set((state) => {
                    const allElements = state.pages.flatMap(p => p.elements);
                    const el = allElements.find(e => e.id === id);
                    if (!el) return {};
                    const below = allElements.filter(e => (e.zIndex || 0) < (el.zIndex || 0));
                    if (!below.length) return {};
                    const prevZ = Math.max(...below.map(e => e.zIndex || 0));
                    return {
                        pages: state.pages.map(p => ({
                            ...p,
                            elements: p.elements.map(e => e.id === id ? { ...e, zIndex: prevZ - 1 } : e)
                        }))
                    };
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
            
            addPage: () => {
                set(state => {
                    const newPage: Page = {
                        id: `page-${Date.now()}`,
                        name: `Page ${state.pages.length + 1}`,
                        elements: [],
                        pageDetails: state.pages[0]?.pageDetails || defaultPageDetails,
                    };
                    return { pages: [...state.pages, newPage], currentPageIndex: state.pages.length };
                });
                get().commitHistory();
            },

            setPages: (pages) => {
                set({ pages: pages, currentPageIndex: pages.length > 0 ? 0 : -1 });
                get().commitHistory();
            },
            
            setActivePage: (index) => set({ currentPageIndex: index }),

            deletePage: (index) => {
                set(state => {
                    const newPages = state.pages.filter((_, i) => i !== index);
                    if (newPages.length === 0) {
                        return { pages: [], currentPageIndex: -1, isNewPageDialogOpen: true };
                    }
                    const newIndex = Math.min(Math.max(0, state.currentPageIndex), newPages.length - 1);
                    return { pages: newPages, currentPageIndex: newIndex };
                });
                get().commitHistory();
            },

            duplicatePage: (index) => {
                set(state => {
                    const pageToDuplicate = state.pages[index];
                    if (!pageToDuplicate) return {};
                    const newPage: Page = {
                        ...pageToDuplicate,
                        id: `page-${Date.now()}`,
                        name: `${pageToDuplicate.name} (Copy)`,
                        elements: pageToDuplicate.elements.map(el => ({
                            ...el,
                            id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        })),
                    };
                    const newPages = [...state.pages, newPage];
                    return { pages: newPages, currentPageIndex: newPages.length - 1 };
                });
                get().commitHistory();
            },
            
            movePage: (from, to) => {
                set(state => {
                    const newPages = [...state.pages];
                    const [movedPage] = newPages.splice(from, 1);
                    newPages.splice(to, 0, movedPage);
                    return { pages: newPages };
                });
                get().commitHistory();
            },

            setNewPageDialogOpen: (isOpen) => set({ isNewPageDialogOpen: isOpen }),

            updatePageDetails: (updates) => set((state) => {
                const newPages = [...state.pages];
                const page = newPages[state.currentPageIndex];
                if(page) {
                    page.pageDetails = { ...page.pageDetails, ...updates };
                }
                return { pages: newPages };
            }),

            updatePageBackground: (updates) => {
                set((state) => {
                    const newPages = [...state.pages];
                    const page = newPages[state.currentPageIndex];
                    if(page) {
                        page.pageDetails.background = { ...page.pageDetails.background, ...updates };
                    }
                    return { pages: newPages };
                });
            },

            setBackgroundRepositioning: (isRepositioning) => set({ isBackgroundRepositioning: isRepositioning }),

            updateTemplateSettings: (updates) => set((state) => ({ templateSettings: { ...state.templateSettings, ...updates } })),

            setTemplateEditMode: (isEditMode) => set({ isTemplateEditMode: isEditMode }),

            markAsTemplateField: (elementId, fieldType, fieldName) => {
                set((state) => ({
                    pages: state.pages.map(p => ({
                        ...p,
                        elements: p.elements.map(el => el.id === elementId ? { ...el, props: { ...el.props, isTemplateField: true, templateFieldType: fieldType, templateFieldName: fieldName } } : el)
                    })),
                    templateSettings: { ...state.templateSettings, editableFields: [...new Set([...state.templateSettings.editableFields, elementId])] },
                }));
                get().commitHistory();
            },
            
            removeTemplateField: (elementId) => {
                set((state) => ({
                    pages: state.pages.map(p => ({
                        ...p,
                        elements: p.elements.map(el => el.id === elementId ? { ...el, props: { ...el.props, isTemplateField: false, templateFieldType: undefined, templateFieldName: undefined } } : el)
                    })),
                    templateSettings: { ...state.templateSettings, editableFields: state.templateSettings.editableFields.filter(id => id !== elementId) },
                }));
                get().commitHistory();
            },

            commitHistory: () => {
                set((state) => {
                    if(state.pages.length === 0) return state; // Don't save history if there are no pages
                    const newHistory = state.history.slice(0, state.historyIndex + 1);
                    newHistory.push({ pages: JSON.parse(JSON.stringify(state.pages)), currentPageIndex: state.currentPageIndex });
                    return { history: newHistory, historyIndex: newHistory.length - 1 };
                });
            },

            undo: () => {
                set((state) => {
                    if (state.historyIndex <= 0) return {};
                    const prev = state.history[state.historyIndex - 1];
                    return {
                        pages: JSON.parse(JSON.stringify(prev.pages)),
                        currentPageIndex: prev.currentPageIndex,
                        historyIndex: state.historyIndex - 1,
                        selectedElementId: null,
                        selectedElementIds: []
                    };
                });
            },

            redo: () => {
                set((state) => {
                    if (state.historyIndex >= state.history.length - 1) return {};
                    const next = state.history[state.historyIndex + 1];
                    return {
                        pages: JSON.parse(JSON.stringify(next.pages)),
                        currentPageIndex: next.currentPageIndex,
                        historyIndex: state.historyIndex + 1,
                        selectedElementId: null,
                        selectedElementIds: []
                    };
                });
            },
            
            getSnapPosition: (element, newX, newY) => {
                const state = get();
                const currentPage = state.pages[state.currentPageIndex];
                if (!currentPage) return { x: newX, y: newY, snappedToId: null };

                const SNAP = 10;
                let snappedX = newX, snappedY = newY, snappedToId: string | null = null;
                const eCX = newX + element.width / 2, eCY = newY + element.height / 2;
                const eR = newX + element.width, eB = newY + element.height;

                for (const other of currentPage.elements) {
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
        }),
        {
            name: 'brandsoft-canvas-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) =>
                Object.fromEntries(
                    Object.entries(state).filter(([key]) => !['history', 'historyIndex'].includes(key))
                ),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.history = [{ pages: state.pages, currentPageIndex: state.currentPageIndex }];
                    state.historyIndex = 0;
                    if(state.pages.length === 0){
                        state.isNewPageDialogOpen = true;
                    } else {
                        state.isNewPageDialogOpen = false;
                    }
                }
            }
        }
    )
);

