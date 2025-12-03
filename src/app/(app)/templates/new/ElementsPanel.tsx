
'use client';

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
    RectangleHorizontal, Circle, Triangle, Star, Square, Heart, Gem, Hexagon, ArrowRight,
    Building2, Image as ImageIcon, MapPin, Phone, Mail, Globe, User, Receipt, CalendarDays, Hash, Type, X, LayoutTemplate
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { useBrandsoft, type BrandsoftTemplate } from '@/hooks/use-brandsoft';
import { useCanvasStore } from '@/stores/canvas-store';
import { TemplatePreview } from '@/app/(app)/templates/page';
import { ImagesPanel } from './sidebar/panels/ImagesPanel';

const handleDragStart = (e: React.DragEvent, data: any) => {
    e.dataTransfer.setData('application/json', JSON.stringify(data));
};

const ShapeItem = ({ icon: Icon, shapeData }: { icon: React.ElementType, shapeData: any }) => (
    <div 
        className="h-24 bg-gray-200 rounded-md flex items-center justify-center cursor-grab hover:bg-gray-300 transition-colors"
        draggable
        onDragStart={(e) => handleDragStart(e, shapeData)}
    >
        <Icon className="h-10 w-10 text-gray-600" />
    </div>
);

const ShapesPanel = () => {
    const rectangleData = { type: 'shape', width: 150, height: 100, rotation: 0, props: { backgroundColor: '#cccccc' } };
    const circleData = { type: 'shape', width: 100, height: 100, rotation: 0, props: { backgroundColor: '#cccccc', borderRadius: '50%' } };
    const triangleData = { type: 'shape', width: 100, height: 100, rotation: 0, props: { width: 0, height: 0, backgroundColor: 'transparent', borderBottom: '100px solid #cccccc', borderLeft: '50px solid transparent', borderRight: '50px solid transparent' } };
    const starData = { type: 'shape', width: 100, height: 100, rotation: 0, props: { backgroundColor: '#cccccc', clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' } };
    const squareData = { type: 'shape', width: 100, height: 100, rotation: 0, props: { backgroundColor: '#cccccc' } };
    const heartData = { type: 'shape', width: 100, height: 100, rotation: 0, props: { backgroundColor: '#cccccc', clipPath: 'path("M10,30 A20,20,0,0,1,50,30 A20,20,0,0,1,90,30 Q90,60,50,90 Q10,60,10,30 Z")' } };
    const diamondData = { type: 'shape', width: 100, height: 100, rotation: 45, props: { backgroundColor: '#cccccc' } };
    const hexagonData = { type: 'shape', width: 100, height: 115.47, rotation: 0, props: { backgroundColor: '#cccccc', clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' } };
    const arrowData = { type: 'shape', width: 150, height: 100, rotation: 0, props: { backgroundColor: '#cccccc', clipPath: 'polygon(0% 20%, 60% 20%, 60% 0%, 100% 50%, 60% 100%, 60% 80%, 0% 80%)' } };

    return (
        <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Shapes</h3>
            <div className="grid grid-cols-2 gap-4">
                <ShapeItem icon={RectangleHorizontal} shapeData={rectangleData} />
                <ShapeItem icon={Circle} shapeData={circleData} />
                <ShapeItem icon={Triangle} shapeData={triangleData} />
                <ShapeItem icon={Star} shapeData={starData} />
                <ShapeItem icon={Square} shapeData={squareData} />
                <ShapeItem icon={Heart} shapeData={heartData} />
                <ShapeItem icon={Gem} shapeData={diamondData} />
                <ShapeItem icon={Hexagon} shapeData={hexagonData} />
                <ShapeItem icon={ArrowRight} shapeData={arrowData} />
            </div>
        </div>
    );
}

const invoiceFields = [
    {
        category: 'Business',
        fields: [
            { name: 'Business Name', value: '{{brand.businessName}}', icon: Building2 },
            { name: 'Business Logo', value: '{{brand.logo}}', type: 'image', icon: ImageIcon },
            { name: 'Business Address', value: '{{brand.address}}', icon: MapPin },
            { name: 'Business Phone', value: '{{brand.phone}}', icon: Phone },
            { name: 'Business Email', value: '{{brand.email}}', icon: Mail },
            { name: 'Business Website', value: '{{brand.website}}', icon: Globe },
        ]
    },
    {
        category: 'Customer',
        fields: [
            { name: 'Customer Name', value: '{{customer.name}}', icon: User },
            { name: 'Customer Email', value: '{{customer.email}}', icon: Mail },
            { name: 'Customer Phone', value: '{{customer.phone}}', icon: Phone },
            { name: 'Customer Address', value: '{{customer.address}}', icon: MapPin },
            { name: 'Company Name', value: '{{customer.companyName}}', icon: Building2 },
        ]
    },
    {
        category: 'Invoice',
        fields: [
            { name: 'Invoice ID', value: '{{invoice.id}}', icon: Hash },
            { name: 'Invoice Date', value: '{{invoice.date}}', icon: CalendarDays },
            { name: 'Due Date', value: '{{invoice.dueDate}}', icon: CalendarDays },
            { name: 'Total Amount', value: '{{invoice.total}}', icon: Receipt },
            { name: 'Subtotal', value: '{{invoice.subtotal}}', icon: Receipt },
            { name: 'Tax Amount', value: '{{invoice.tax}}', icon: Receipt },
            { name: 'Discount Amount', value: '{{invoice.discount}}', icon: Receipt },
            { name: 'Shipping Amount', value: '{{invoice.shipping}}', icon: Receipt },
        ]
    },
    {
        category: 'Line Items',
        fields: [
             { name: 'Items Table', value: '{{invoice.items}}', type: 'table', icon: Building2 },
        ]
    }
];

const FieldsPanel = () => {
    const fieldData = (value: string) => ({
        type: 'text',
        width: 150, height: 20, rotation: 0,
        props: { text: value, fontSize: 14, color: '#000000' }
    });

    const FieldIcon = ({ field }: { field: typeof invoiceFields[0]['fields'][0] }) => (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div 
                        className="h-16 bg-gray-200 rounded-md flex items-center justify-center cursor-grab hover:bg-gray-300 transition-colors"
                        draggable
                        onDragStart={(e) => handleDragStart(e, fieldData(field.value))}
                    >
                        <field.icon className="h-6 w-6 text-gray-700" />
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{field.name}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );

    return (
        <div className="p-2">
             <Accordion type="multiple" defaultValue={['Business', 'Customer', 'Invoice']} className="w-full">
                {invoiceFields.map(group => (
                    <AccordionItem value={group.category} key={group.category}>
                        <AccordionTrigger className="text-xs font-medium py-2 px-2 hover:bg-gray-200 rounded-md">
                            {group.category}
                        </AccordionTrigger>
                        <AccordionContent>
                           <div className="grid grid-cols-3 gap-2 pt-2">
                             {group.fields.map(field => (
                                <FieldIcon key={field.name} field={field} />
                             ))}
                           </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    )
}

const TemplatesPanel = () => {
    const { config } = useBrandsoft();
    const { setPages } = useCanvasStore();
    const templates = config?.templates || [];

    const handleTemplateClick = (template: BrandsoftTemplate) => {
        // Deep copy pages to avoid unintended mutations
        const newPages = JSON.parse(JSON.stringify(template.pages));
        setPages(newPages);
    };

    if (templates.length === 0) {
        return (
            <div className="p-4 text-center text-sm text-gray-400">
                <LayoutTemplate className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                No saved templates found.
            </div>
        );
    }
    
    return (
        <div className="p-2 space-y-2">
            {templates.map(template => (
                <div key={template.id} className="cursor-pointer" onClick={() => handleTemplateClick(template)}>
                    <Card className="overflow-hidden hover:shadow-md hover:border-primary">
                        <CardContent className="p-0 aspect-[8.5/11] bg-gray-100">
                            {template.pages[0] && <TemplatePreview page={template.pages[0]} />}
                        </CardContent>
                        <CardHeader className="p-2">
                            <p className="text-xs font-medium truncate">{template.name}</p>
                        </CardHeader>
                    </Card>
                </div>
            ))}
        </div>
    )
}

const PanelContent = ({ activeTool }: { activeTool: string | null }) => {
    switch(activeTool) {
        case 'Shapes': return <ShapesPanel />;
        case 'Fields': return <FieldsPanel />;
        case 'Templates': return <TemplatesPanel />;
        case 'Images': return <ImagesPanel />;
        default:
            return (
                <div className="p-4">
                     <div className="flex h-40 items-center justify-center text-center text-sm text-gray-400">
                        <p>No items available for this tool yet.</p>
                    </div>
                </div>
            );
    }
}

interface ElementsPanelProps {
    activeTool: string | null;
    onClose: () => void;
    position: { x: number; y: number };
    setPosition: (position: { x: number; y: number }) => void;
}


const ElementsPanel = ({ activeTool, onClose, position, setPosition }: ElementsPanelProps) => {
    if (!activeTool) return null;

    const dragStartPos = React.useRef({ x: 0, y: 0 });
    const panelStartPos = React.useRef({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        panelStartPos.current = position;
        e.preventDefault();

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const dx = moveEvent.clientX - dragStartPos.current.x;
            const dy = moveEvent.clientY - dragStartPos.current.y;
            setPosition({
                x: panelStartPos.current.x + dx,
                y: panelStartPos.current.y + dy,
            });
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <Card 
            className="absolute w-64 z-20 h-[70vh] flex flex-col"
            style={{ top: position.y, left: position.x }}
        >
            <CardHeader 
                className="p-2 border-b flex flex-row items-center justify-between bg-primary rounded-t-lg text-primary-foreground cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
            >
                <h3 className="text-sm font-medium pl-2">{activeTool}</h3>
                <Button variant="ghost" size="icon" onClick={onClose} className="text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground h-7 w-7 cursor-pointer">
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>
            <ScrollArea className="flex-grow">
                <PanelContent activeTool={activeTool} />
            </ScrollArea>
        </Card>
    );
};

export default ElementsPanel;
