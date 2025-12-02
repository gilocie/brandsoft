
'use client';

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCanvasStore } from '@/stores/canvas-store';
import { RectangleHorizontal, Circle, Triangle, Star, Square, Heart, Gem, Hexagon, ArrowRight } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


const ShapeItem = ({ icon: Icon, addShape }: { icon: React.ElementType, addShape: () => void }) => (
    <div 
        className="h-24 bg-gray-200 rounded-md flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors"
        onClick={addShape}
    >
        <Icon className="h-10 w-10 text-gray-600" />
    </div>
);

const ShapesPanel = () => {
    const { addElement } = useCanvasStore();

    const addRectangle = () => {
        addElement({
            type: 'shape',
            x: 100, y: 100, width: 150, height: 100, rotation: 0,
            props: { backgroundColor: '#cccccc' }
        });
    }
    
    const addCircle = () => {
         addElement({
            type: 'shape',
            x: 150, y: 150, width: 100, height: 100, rotation: 0,
            props: { backgroundColor: '#cccccc', borderRadius: '50%' }
        });
    }
    
    const addTriangle = () => {
        addElement({
            type: 'shape',
            x: 150, y: 150, width: 100, height: 100, rotation: 0,
            props: { 
                backgroundColor: 'transparent',
                borderBottom: '100px solid #cccccc',
                borderLeft: '50px solid transparent',
                borderRight: '50px solid transparent',
            }
        });
    };

    const addStar = () => {
        addElement({
            type: 'shape',
            x: 150, y: 150, width: 100, height: 100, rotation: 0,
            props: {
                backgroundColor: '#cccccc',
                clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
            }
        });
    };
    
    const addSquare = () => {
        addElement({
            type: 'shape',
            x: 125, y: 125, width: 100, height: 100, rotation: 0,
            props: { backgroundColor: '#cccccc' }
        });
    };
    
    const addHeart = () => {
         addElement({
            type: 'shape',
            x: 150, y: 150, width: 100, height: 100, rotation: 0,
            props: { 
                backgroundColor: '#cccccc',
                clipPath: 'path("M10,30 A20,20,0,0,1,50,30 A20,20,0,0,1,90,30 Q90,60,50,90 Q10,60,10,30 Z")'
            }
        });
    };
    
    const addDiamond = () => {
         addElement({
            type: 'shape',
            x: 150, y: 150, width: 100, height: 100, rotation: 45,
            props: { backgroundColor: '#cccccc' }
        });
    };
    
    const addHexagon = () => {
        addElement({
            type: 'shape',
            x: 150, y: 150, width: 100, height: 115.47, rotation: 0,
            props: { 
                backgroundColor: '#cccccc',
                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
            }
        });
    };
    
    const addArrow = () => {
        addElement({
            type: 'shape',
            x: 150, y: 150, width: 150, height: 100, rotation: 0,
            props: { 
                backgroundColor: '#cccccc',
                clipPath: 'polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%)'
            }
        });
    };


    return (
        <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Shapes</h3>
            <div className="grid grid-cols-2 gap-4">
                <ShapeItem icon={RectangleHorizontal} addShape={addRectangle} />
                <ShapeItem icon={Circle} addShape={addCircle} />
                <ShapeItem icon={Triangle} addShape={addTriangle} />
                <ShapeItem icon={Star} addShape={addStar} />
                <ShapeItem icon={Square} addShape={addSquare} />
                <ShapeItem icon={Heart} addShape={addHeart} />
                <ShapeItem icon={Gem} addShape={addDiamond} />
                <ShapeItem icon={Hexagon} addShape={addHexagon} />
                <ShapeItem icon={ArrowRight} addShape={addArrow} />
            </div>
        </div>
    );
}

const invoiceFields = [
    {
        category: 'Business',
        fields: [
            { name: 'Business Name', value: '{{brand.businessName}}' },
            { name: 'Business Logo', value: '{{brand.logo}}', type: 'image' },
            { name: 'Business Address', value: '{{brand.address}}' },
            { name: 'Business Phone', value: '{{brand.phone}}' },
            { name: 'Business Email', value: '{{brand.email}}' },
            { name: 'Business Website', value: '{{brand.website}}' },
        ]
    },
    {
        category: 'Customer',
        fields: [
            { name: 'Customer Name', value: '{{customer.name}}' },
            { name: 'Customer Email', value: '{{customer.email}}' },
            { name: 'Customer Phone', value: '{{customer.phone}}' },
            { name: 'Customer Address', value: '{{customer.address}}' },
            { name: 'Company Name', value: '{{customer.companyName}}' },
        ]
    },
    {
        category: 'Invoice',
        fields: [
            { name: 'Invoice ID', value: '{{invoice.id}}' },
            { name: 'Invoice Date', value: '{{invoice.date}}' },
            { name: 'Due Date', value: '{{invoice.dueDate}}' },
            { name: 'Total Amount', value: '{{invoice.total}}' },
            { name: 'Subtotal', value: '{{invoice.subtotal}}' },
            { name: 'Tax Amount', value: '{{invoice.tax}}' },
            { name: 'Discount Amount', value: '{{invoice.discount}}' },
            { name: 'Shipping Amount', value: '{{invoice.shipping}}' },
        ]
    },
    {
        category: 'Line Items',
        fields: [
             { name: 'Items Table', value: '{{invoice.items}}', type: 'table' },
        ]
    }
];

const FieldsPanel = () => {
    const { addElement } = useCanvasStore();

    const addField = (name: string, value: string) => {
        addElement({
            type: 'text',
            x: 50, y: 50, width: 150, height: 20, rotation: 0,
            props: { text: value, fontSize: 14, color: '#000000' }
        });
    }

    return (
        <div className="p-2">
            <h3 className="text-sm font-medium text-gray-500 mb-2 px-2">Text & Dynamic Fields</h3>
             <Accordion type="multiple" defaultValue={['Business', 'Customer', 'Invoice']} className="w-full">
                {invoiceFields.map(group => (
                    <AccordionItem value={group.category} key={group.category}>
                        <AccordionTrigger className="text-xs font-medium py-2 px-2 hover:bg-gray-200 rounded-md">
                            {group.category}
                        </AccordionTrigger>
                        <AccordionContent>
                           <div className="flex flex-col gap-1 pt-2">
                             {group.fields.map(field => (
                                <div key={field.name}
                                     className="text-xs p-2 rounded-md cursor-pointer hover:bg-gray-300"
                                     onClick={() => addField(field.name, field.value)}
                                >
                                    {field.name}
                                </div>
                             ))}
                           </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    )
}

const PanelContent = ({ activeTool }: { activeTool: string | null }) => {
    switch(activeTool) {
        case 'Shapes':
            return <ShapesPanel />;
        case 'Fields':
            return <FieldsPanel />;
        default:
            return (
                <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-4">{activeTool}</h3>
                     <div className="flex h-40 items-center justify-center text-center text-sm text-gray-400">
                        <p>No items available for this tool yet.</p>
                    </div>
                </div>
            );
    }
}


const ElementsPanel = ({ activeTool }: { activeTool: string | null }) => {
    if (!activeTool) return null;

    return (
        <div className="w-56 bg-gray-100 border-l border-r border-gray-200 z-10">
            <ScrollArea className="h-full">
                <PanelContent activeTool={activeTool} />
            </ScrollArea>
        </div>
    );
};

export default ElementsPanel;
