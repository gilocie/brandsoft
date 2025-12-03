'use client';

import React from 'react';
import { useCanvasStore } from '@/stores/canvas-store';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tag, X } from 'lucide-react';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const TEMPLATE_FIELD_TYPES = [
    { value: 'logo', label: 'Logo' },
    { value: 'background', label: 'Background' },
    { value: 'header', label: 'Header' },
    { value: 'footer', label: 'Footer' },
    { value: 'image', label: 'Image' },
    { value: 'text', label: 'Text' },
];

export const TemplatePanel = () => {
    const {
        selectedElementId,
        pages,
        currentPageIndex,
        templateSettings,
        updateTemplateSettings,
        markAsTemplateField,
        removeTemplateField,
        isTemplateEditMode,
        setTemplateEditMode,
        commitHistory,
    } = useCanvasStore();

    const elements = pages[currentPageIndex]?.elements || [];
    const selectedElement = elements.find(el => el.id === selectedElementId);
    const templateFields = elements.filter(el => el.props.isTemplateField);

    const [fieldName, setFieldName] = React.useState('');
    const [fieldType, setFieldType] = React.useState<string>('text');

    const handleMarkAsField = () => {
        if (selectedElementId && fieldType) {
            markAsTemplateField(
                selectedElementId,
                fieldType as 'logo' | 'background' | 'header' | 'footer' | 'image' | 'text',
                fieldName || fieldType
            );
            setFieldName('');
        }
    };

    return (
        <AccordionItem value="template">
            <AccordionTrigger className="text-xs font-medium py-2 px-3 hover:no-underline">
                <div className="flex items-center gap-2">
                    <Tag className="h-3 w-3" />
                    Template Settings
                </div>
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3 space-y-4">
                {/* Template Mode Toggle */}
                <div className="flex items-center justify-between">
                    <div>
                        <Label className="text-xs font-medium">Template Edit Mode</Label>
                        <p className="text-xs text-muted-foreground">
                            Only template fields are editable
                        </p>
                    </div>
                    <Switch
                        checked={isTemplateEditMode}
                        onCheckedChange={setTemplateEditMode}
                    />
                </div>

                <Separator />

                {/* Template Info */}
                <div className="space-y-2">
                    <Label className="text-xs">Template Name</Label>
                    <Input
                        value={templateSettings.templateName}
                        onChange={(e) => updateTemplateSettings({ templateName: e.target.value })}
                        onBlur={commitHistory}
                        placeholder="My Template"
                        className="h-8 text-xs"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-xs">Description</Label>
                    <Input
                        value={templateSettings.templateDescription}
                        onChange={(e) => updateTemplateSettings({ templateDescription: e.target.value })}
                        onBlur={commitHistory}
                        placeholder="Template description..."
                        className="h-8 text-xs"
                    />
                </div>

                <Separator />

                {/* Mark Selected Element */}
                {selectedElement && !selectedElement.props.isTemplateField && (
                    <div className="space-y-3 p-3 bg-muted rounded-md">
                        <Label className="text-xs font-medium">Mark as Template Field</Label>
                        
                        <div className="space-y-2">
                            <Label className="text-xs">Field Type</Label>
                            <Select value={fieldType} onValueChange={setFieldType}>
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {TEMPLATE_FIELD_TYPES.map(({ value, label }) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs">Field Name (optional)</Label>
                            <Input
                                value={fieldName}
                                onChange={(e) => setFieldName(e.target.value)}
                                placeholder="e.g., Company Logo"
                                className="h-8 text-xs"
                            />
                        </div>

                        <Button size="sm" className="w-full" onClick={handleMarkAsField}>
                            <Tag className="h-3 w-3 mr-1" />
                            Mark as Template Field
                        </Button>
                    </div>
                )}

                {/* Current Element is Template Field */}
                {selectedElement?.props.isTemplateField && (
                    <div className="space-y-3 p-3 bg-emerald-50 dark:bg-emerald-950 rounded-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                                    Template Field
                                </Label>
                                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                    {selectedElement.props.templateFieldName || selectedElement.props.templateFieldType}
                                </p>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                                {selectedElement.props.templateFieldType}
                            </Badge>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => removeTemplateField(selectedElementId!)}
                        >
                            <X className="h-3 w-3 mr-1" />
                            Remove Template Field
                        </Button>
                    </div>
                )}

                <Separator />

                {/* Template Fields List */}
                <div className="space-y-2">
                    <Label className="text-xs font-medium">
                        Template Fields ({templateFields.length})
                    </Label>
                    {templateFields.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                            No template fields defined. Select an element and mark it as a template field.
                        </p>
                    ) : (
                        <div className="space-y-1 max-h-[150px] overflow-y-auto">
                            {templateFields.map((el) => (
                                <div
                                    key={el.id}
                                    className="flex items-center justify-between p-2 bg-muted rounded text-xs"
                                >
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-[10px]">
                                            {el.props.templateFieldType}
                                        </Badge>
                                        <span className="truncate max-w-[100px]">
                                            {el.props.templateFieldName || el.type}
                                        </span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5"
                                        onClick={() => removeTemplateField(el.id)}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </AccordionContent>
        </AccordionItem>
    );
};
