'use client';

import React, { useState } from 'react';
import { Type, Square, Trash2, Menu, X, ImageIcon } from 'lucide-react';

// Hooks
const useCanvas = () => {
    const [elements, setElements] = useState([]);
    const [selectedElementId, setSelectedElementId] = useState(null);

    const addElement = (element) => {
        const newElement = { ...element, id: Date.now().toString() };
        setElements([...elements, newElement]);
    };

    const updateElement = (id, updates) => {
        setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el));
    };

    const deleteElement = (id) => {
        setElements(elements.filter(el => el.id !== id));
        setSelectedElementId(null);
    };

    const selectElement = (id) => {
        setSelectedElementId(id);
    };

    return { elements, selectedElementId, addElement, updateElement, deleteElement, selectElement };
};

const useDrag = ({ onDrag }) => {
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = React.useRef({ x: 0, y: 0 });

    const onDragStart = (e) => {
        setIsDragging(true);
        dragStart.current = { x: e.clientX, y: e.clientY };

        const handleMouseMove = (moveEvent) => {
            const deltaX = moveEvent.clientX - dragStart.current.x;
            const deltaY = moveEvent.clientY - dragStart.current.y;
            dragStart.current = { x: moveEvent.clientX, y: moveEvent.clientY };
            onDrag(deltaX, deltaY);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    return { onDragStart, isDragging };
};

// Components
const DraggableElement = ({ icon: Icon, label, type, defaultProps }) => {
    const handleDragStart = (e) => {
        const elementData = JSON.stringify({ type, props: defaultProps });
        e.dataTransfer.setData('application/json', elementData);
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            className="group flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 cursor-grab active:cursor-grabbing transition-all"
        >
            <div className="p-2 rounded-md bg-gray-100 group-hover:bg-blue-100 transition-colors">
                <Icon className="h-5 w-5 text-gray-600 group-hover:text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
    );
};

const VariableElement = ({ label, variable }) => {
    const handleDragStart = (e) => {
        const elementData = JSON.stringify({
            type: 'text',
            props: { text: variable, fontSize: 14, fontFamily: 'sans-serif', color: '#000000' }
        });
        e.dataTransfer.setData('application/json', elementData);
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            className="p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 cursor-grab active:cursor-grabbing transition-all"
        >
            <span className="font-mono text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">{variable}</span>
            <p className="text-xs text-gray-500 mt-2">{label}</p>
        </div>
    );
};

const ElementsPanel = ({ isOpen, onClose }) => {
    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
            )}
            
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50
                w-72 h-full bg-gray-50 border-r border-gray-200
                transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                overflow-y-auto
            `}>
                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between lg:hidden">
                        <h2 className="text-lg font-semibold text-gray-900">Elements</h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Static Elements</h3>
                        <div className="space-y-2">
                            <DraggableElement icon={Type} label="Text" type="text" defaultProps={{ text: "New Text", fontSize: 16, color: '#000000' }} />
                            <DraggableElement icon={ImageIcon} label="Image" type="image" defaultProps={{ src: "https://picsum.photos/seed/image/200/300" }} />
                            <DraggableElement icon={Square} label="Shape" type="shape" defaultProps={{ shapeType: 'rectangle', fillColor: '#e5e7eb', strokeColor: '#000000', strokeWidth: 2 }} />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Invoice Variables</h3>
                        <div className="space-y-2">
                            <VariableElement label="Invoice Number" variable="{{invoice_number}}" />
                            <VariableElement label="Client Name" variable="{{client_name}}" />
                            <VariableElement label="Date" variable="{{date}}" />
                            <VariableElement label="Total Amount" variable="{{total}}" />
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

const PropertiesPanel = ({ isOpen, onClose }) => {
    const { elements, selectedElementId, updateElement, deleteElement } = useCanvas();
    const selectedElement = elements.find(el => el.id === selectedElementId);

    const handlePropertyChange = (property, value) => {
        if (selectedElementId) {
            updateElement(selectedElementId, { [property]: value });
        }
    };

    const handleDelete = () => {
        if (selectedElementId) {
            deleteElement(selectedElementId);
        }
    };

    const PropertyInput = ({ label, type = "text", value, onChange }) => (
        <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">{label}</label>
            <input
                type={type}
                value={value}
                onChange={onChange}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
    );

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
            )}
            
            <aside className={`
                fixed lg:static inset-y-0 right-0 z-50
                w-72 h-full bg-gray-50 border-l border-gray-200
                transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
                overflow-y-auto
            `}>
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6 lg:hidden">
                        <h2 className="text-lg font-semibold text-gray-900">Properties</h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {selectedElement ? (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Position</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <PropertyInput label="X" type="number" value={selectedElement.x} onChange={(e) => handlePropertyChange('x', parseInt(e.target.value))} />
                                    <PropertyInput label="Y" type="number" value={selectedElement.y} onChange={(e) => handlePropertyChange('y', parseInt(e.target.value))} />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Size</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <PropertyInput label="Width" type="number" value={selectedElement.width} onChange={(e) => handlePropertyChange('width', parseInt(e.target.value))} />
                                    <PropertyInput label="Height" type="number" value={selectedElement.height} onChange={(e) => handlePropertyChange('height', parseInt(e.target.value))} />
                                </div>
                            </div>

                            {selectedElement.type === 'text' && (
                                <>
                                    <div className="space-y-3">
                                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Text</h3>
                                        <PropertyInput label="Content" value={selectedElement.text} onChange={(e) => handlePropertyChange('text', e.target.value)} />
                                        <PropertyInput label="Font Size" type="number" value={selectedElement.fontSize} onChange={(e) => handlePropertyChange('fontSize', parseInt(e.target.value))} />
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Color</h3>
                                        <div className="flex gap-2">
                                            <input type="color" value={selectedElement.color} onChange={(e) => handlePropertyChange('color', e.target.value)} className="w-12 h-10 rounded cursor-pointer" />
                                            <input type="text" value={selectedElement.color} onChange={(e) => handlePropertyChange('color', e.target.value)} className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                    </div>
                                </>
                            )}

                            {selectedElement.type === 'shape' && (
                                <>
                                    <div className="space-y-3">
                                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Fill</h3>
                                        <div className="flex gap-2">
                                            <input type="color" value={selectedElement.fillColor} onChange={(e) => handlePropertyChange('fillColor', e.target.value)} className="w-12 h-10 rounded cursor-pointer" />
                                            <input type="text" value={selectedElement.fillColor} onChange={(e) => handlePropertyChange('fillColor', e.target.value)} className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Stroke</h3>
                                        <div className="flex gap-2">
                                            <input type="color" value={selectedElement.strokeColor} onChange={(e) => handlePropertyChange('strokeColor', e.target.value)} className="w-12 h-10 rounded cursor-pointer" />
                                            <input type="text" value={selectedElement.strokeColor} onChange={(e) => handlePropertyChange('strokeColor', e.target.value)} className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                        <PropertyInput label="Width" type="number" value={selectedElement.strokeWidth} onChange={(e) => handlePropertyChange('strokeWidth', parseInt(e.target.value))} />
                                    </div>
                                </>
                            )}

                            <div className="pt-4 border-t border-gray-200">
                                <button onClick={handleDelete} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors">
                                    <Trash2 className="h-4 w-4" />
                                    Delete Element
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center py-12">
                            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-3">
                                <Type className="h-8 w-8 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-500">Select an element to view properties</p>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
};

const Element = ({ element }) => {
    const { updateElement, selectElement, selectedElementId } = useCanvas();
    const isSelected = selectedElementId === element.id;

    const handleDrag = (deltaX, deltaY) => {
        updateElement(element.id, { x: element.x + deltaX, y: element.y + deltaY });
    };

    const { onDragStart, isDragging } = useDrag({ onDrag: handleDrag });

    const handleSelect = (e) => {
        e.stopPropagation();
        selectElement(element.id);
    };

    return (
        <div
            onMouseDown={(e) => { onDragStart(e); handleSelect(e); }}
            className="absolute"
            style={{
                left: `${element.x}px`,
                top: `${element.y}px`,
                width: `${element.width}px`,
                height: `${element.height}px`,
                cursor: isDragging ? 'grabbing' : 'grab',
                outline: isSelected ? '2px solid #3b82f6' : 'none',
                outlineOffset: '2px',
            }}
        >
            {element.type === 'text' && (
                <p style={{ fontSize: `${element.fontSize}px`, color: element.color, fontFamily: element.fontFamily || 'sans-serif' }}>
                    {element.text}
                </p>
            )}
            {element.type === 'image' && (
                <img src={element.src} alt="canvas element" className="w-full h-full object-cover" />
            )}
            {element.type === 'shape' && (
                <div className="w-full h-full" style={{
                    backgroundColor: element.fillColor,
                    border: `${element.strokeWidth}px solid ${element.strokeColor}`,
                    borderRadius: element.shapeType === 'circle' ? '50%' : '0px',
                }} />
            )}
        </div>
    );
};

const Canvas = () => {
    const { elements, addElement, selectElement } = useCanvas();

    const handleDrop = (e) => {
        e.preventDefault();
        const elementDataString = e.dataTransfer.getData('application/json');
        if (!elementDataString) return;

        const { type, props } = JSON.parse(elementDataString);
        const canvasRect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - canvasRect.left;
        const y = e.clientY - canvasRect.top;

        const newElement = { type, x, y, width: 150, height: 50, rotation: 0, ...props };
        addElement(newElement);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleCanvasClick = () => {
        selectElement(null);
    };

    return (
        <div className="w-full h-full flex items-center justify-center p-8">
            <div className="bg-white shadow-2xl" style={{ width: '8.5in', height: '11in' }} onClick={handleCanvasClick}>
                <div className="w-full h-full relative" onDrop={handleDrop} onDragOver={handleDragOver}>
                    {elements.map((el) => (
                        <Element key={el.id} element={el} />
                    ))}
                    {elements.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <p className="text-lg font-medium mb-1">Drop elements here</p>
                                <p className="text-sm">Drag from the left panel to get started</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function NewTemplatePage() {
    const [leftPanelOpen, setLeftPanelOpen] = useState(false);
    const [rightPanelOpen, setRightPanelOpen] = useState(false);

    return (
        <div className="flex flex-col h-screen w-screen bg-gradient-to-br from-gray-100 to-gray-200">
            {/* Header */}
            <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-30">
                <div className="flex items-center gap-4">
                    <button onClick={() => setLeftPanelOpen(!leftPanelOpen)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
                        <Menu className="h-5 w-5" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">Design Studio</h1>
                </div>
                <button onClick={() => setRightPanelOpen(!rightPanelOpen)} className="lg:hidden px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium">
                    Properties
                </button>
            </header>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden relative">
                <ElementsPanel isOpen={leftPanelOpen} onClose={() => setLeftPanelOpen(false)} />
                
                <main className="flex-1 overflow-auto bg-gradient-to-br from-gray-100 to-gray-200">
                    <Canvas />
                </main>
                
                <PropertiesPanel isOpen={rightPanelOpen} onClose={() => setRightPanelOpen(false)} />
            </div>
        </div>
    );
}