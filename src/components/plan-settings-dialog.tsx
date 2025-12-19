'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette, Type, Sparkles, Check, UploadCloud } from 'lucide-react';
import type { Plan, PlanCustomization } from '@/hooks/use-brandsoft';
import { Switch } from './ui/switch';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { Slider } from './ui/slider';

interface PlanSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan | null;
  onSave: (planName: string, customization: PlanCustomization) => void;
}

const ImageUploader = ({ value, onChange, label, aspect }: { value?: string, onChange: (val: string) => void, label: string, aspect: 'wide' | 'normal' }) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onChange(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <div className={`relative flex items-center justify-center space-y-2 rounded-md border border-dashed p-2 w-full ${aspect === 'wide' ? 'h-16' : 'h-32'}`}>
                {value ? (
                    <img src={value} alt={`${label} preview`} className="max-h-full max-w-full object-contain" />
                ) : (
                    <p className="text-xs text-muted-foreground">No image</p>
                )}
            </div>
            <Input type="file" accept="image/*" className="hidden" ref={inputRef} onChange={handleFileChange} />
            <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} className="w-full h-8 text-xs">
                <UploadCloud className="mr-2 h-3 w-3" /> {value ? 'Change' : 'Upload'}
            </Button>
        </div>
    );
};


export function PlanSettingsDialog({ isOpen, onClose, plan, onSave }: PlanSettingsDialogProps) {
  const [customization, setCustomization] = useState<PlanCustomization>({});

  useEffect(() => {
    if (plan) {
      setCustomization(plan.customization || {});
    }
  }, [plan]);

  const handleSave = () => {
    if (plan) {
      onSave(plan.name, customization);
    }
  };

  const handleChange = (key: keyof PlanCustomization, value: any) => {
    setCustomization(prev => ({ ...prev, [key]: value }));
  };

  if (!plan) return null;

  const isRecommended = customization.isRecommended;
  const cardBgColor = customization?.bgColor || (isRecommended ? 'rgb(88, 80, 236)' : 'rgb(30, 30, 35)');
  const cardTextColor = customization?.textColor || 'rgb(255, 255, 255)';
  const borderColor = customization?.borderColor || (isRecommended ? 'rgb(88, 80, 236)' : 'rgb(45, 45, 50)');
  const badgeColor = customization?.badgeColor || 'rgb(255, 107, 53)';
  const badgeText = customization?.badgeText || 'Most popular';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <DialogTitle>Customize "{plan.name}" Plan</DialogTitle>
          <DialogDescription>
            Personalize the appearance and messaging for this subscription plan.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full px-6">
            <div className="py-4 space-y-6 pb-6">
              <Tabs defaultValue="promo" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="promo">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Promotion
                  </TabsTrigger>
                  <TabsTrigger value="colors">
                    <Palette className="h-4 w-4 mr-2" />
                    Appearance
                  </TabsTrigger>
                  <TabsTrigger value="text">
                    <Type className="h-4 w-4 mr-2" />
                    Text
                  </TabsTrigger>
                </TabsList>
                
                 <TabsContent value="promo" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Promotional Settings</CardTitle>
                      <CardDescription>Make this plan stand out.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <div className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <Label htmlFor="isRecommended" className="font-medium">Mark as "Recommended"</Label>
                            <p className="text-sm text-muted-foreground">Highlight this plan with special styling</p>
                          </div>
                          <Switch
                            id="isRecommended"
                            checked={customization.isRecommended || false}
                            onCheckedChange={(checked) => handleChange('isRecommended', checked)}
                          />
                        </div>

                      <div className="space-y-2">
                        <Label>Promotional Discount</Label>
                        <div className="flex gap-2">
                            <ToggleGroup
                                type="single"
                                value={customization.discountType}
                                onValueChange={(value: 'flat' | 'percentage') => handleChange('discountType', value)}
                                className="border rounded-md"
                            >
                                <ToggleGroupItem value="percentage" className="h-10 px-3">%</ToggleGroupItem>
                                <ToggleGroupItem value="flat" className="h-10 px-3">K</ToggleGroupItem>
                            </ToggleGroup>
                          <Input
                            type="number"
                            value={customization.discountValue || ''}
                            onChange={(e) => handleChange('discountValue', e.target.value ? Number(e.target.value) : undefined)}
                            placeholder="e.g., 10 or 500"
                            className="flex-1"
                          />
                        </div>
                      </div>
                       <div className="space-y-2">
                        <Label htmlFor="badgeText">Badge Text</Label>
                        <Input
                          id="badgeText"
                          value={customization.badgeText || ''}
                          onChange={(e) => handleChange('badgeText', e.target.value)}
                          placeholder="e.g., Most popular, Best Value"
                        />
                      </div>
                       <div className="space-y-2">
                        <Label htmlFor="badgeColor">Badge Color</Label>
                        <div className="flex gap-2">
                          <Input id="badgeColor" type="color" value={customization.badgeColor || '#FF6B35'} onChange={(e) => handleChange('badgeColor', e.target.value)} className="w-20 h-10"/>
                          <Input type="text" value={customization.badgeColor || '#FF6B35'} onChange={(e) => handleChange('badgeColor', e.target.value)} placeholder="#FF6B35" className="flex-1"/>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="colors" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Color Scheme</CardTitle>
                      <CardDescription>Customize the colors for this plan's card</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <ImageUploader 
                          label="Header Background Image" 
                          value={customization.headerBgImage}
                          onChange={(v) => handleChange('headerBgImage', v)}
                          aspect="wide"
                       />
                       {customization.headerBgImage && (
                          <div className="space-y-2">
                              <Label>Header Image Opacity</Label>
                              <Slider
                                  value={[(customization.headerBgImageOpacity ?? 1) * 100]}
                                  onValueChange={([v]) => handleChange('headerBgImageOpacity', v / 100)}
                                  max={100}
                                  step={1}
                              />
                          </div>
                       )}

                      <div className="space-y-2">
                        <Label htmlFor="bgColor">Background Color</Label>
                        <div className="flex gap-2">
                          <Input 
                            id="bgColor" 
                            type="color" 
                            value={customization.bgColor || (isRecommended ? '#5850EC' : '#1E1E23')} 
                            onChange={(e) => handleChange('bgColor', e.target.value)} 
                            className="w-20 h-10"
                          />
                          <Input 
                            type="text" 
                            value={customization.bgColor || (isRecommended ? '#5850EC' : '#1E1E23')} 
                            onChange={(e) => handleChange('bgColor', e.target.value)} 
                            placeholder={isRecommended ? "#5850EC" : "#1E1E23"} 
                            className="flex-1"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {isRecommended ? 'Recommended: vibrant purple (#5850EC)' : 'Default: dark gray (#1E1E23)'}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="textColor">Text Color</Label>
                        <div className="flex gap-2">
                          <Input 
                            id="textColor" 
                            type="color" 
                            value={customization.textColor || '#FFFFFF'} 
                            onChange={(e) => handleChange('textColor', e.target.value)} 
                            className="w-20 h-10"
                          />
                          <Input 
                            type="text" 
                            value={customization.textColor || '#FFFFFF'} 
                            onChange={(e) => handleChange('textColor', e.target.value)} 
                            placeholder="#FFFFFF" 
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="borderColor">Border Color</Label>
                        <div className="flex gap-2">
                          <Input 
                            id="borderColor" 
                            type="color" 
                            value={customization.borderColor || (isRecommended ? '#5850EC' : '#2D2D32')} 
                            onChange={(e) => handleChange('borderColor', e.target.value)} 
                            className="w-20 h-10"
                          />
                          <Input 
                            type="text" 
                            value={customization.borderColor || (isRecommended ? '#5850EC' : '#2D2D32')} 
                            onChange={(e) => handleChange('borderColor', e.target.value)} 
                            placeholder={isRecommended ? "#5850EC" : "#2D2D32"} 
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="text" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Custom Text</CardTitle>
                      <CardDescription>Override default text for this plan</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="customTitle">Custom Title</Label>
                        <Input id="customTitle" value={customization.customTitle || ''} onChange={(e) => handleChange('customTitle', e.target.value)} placeholder={plan.name}/>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="customDescription">Custom Description</Label>
                        <Input 
                          id="customDescription" 
                          value={customization.customDescription || ''} 
                          onChange={(e) => handleChange('customDescription', e.target.value)} 
                          placeholder="Add a custom description..."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ctaText">Call-to-Action Button Text</Label>
                        <Input 
                          id="ctaText" 
                          value={customization.ctaText || ''} 
                          onChange={(e) => handleChange('ctaText', e.target.value)} 
                          placeholder="Choose this plan"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>See how your customizations will look</CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className="border-2 rounded-2xl p-8 space-y-6 text-left relative"
                    style={{
                      backgroundColor: cardBgColor,
                      borderColor: borderColor,
                      color: cardTextColor,
                    }}
                  >
                    {(isRecommended && badgeText) && (
                      <div className="absolute top-6 right-6">
                        <span 
                          className="text-xs font-bold px-3 py-1.5 rounded-full text-white" 
                          style={{ backgroundColor: badgeColor }}
                        >
                          {badgeText}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-4">
                      {customization.headerBgImage ? (
                          <div className="w-14 h-14 rounded-2xl bg-cover bg-center" style={{backgroundImage: `url(${customization.headerBgImage})`, opacity: customization.headerBgImageOpacity || 1}} />
                      ) : (
                          <div 
                            className="h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0" 
                            style={{ backgroundColor: isRecommended ? 'rgba(255, 255, 255, 0.15)' : 'rgba(99, 102, 241, 0.15)' }}
                          >
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke={isRecommended ? '#FFFFFF' : 'rgb(99, 102, 241)'} strokeWidth="2" strokeLinejoin="round"/>
                              <path d="M2 7L12 12L22 7" stroke={isRecommended ? '#FFFFFF' : 'rgb(99, 102, 241)'} strokeWidth="2" strokeLinejoin="round"/>
                              <path d="M12 12V22" stroke={isRecommended ? '#FFFFFF' : 'rgb(99, 102, 241)'} strokeWidth="2" strokeLinejoin="round"/>
                            </svg>
                          </div>
                      )}
                      
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold mb-2">
                          {customization.customTitle || plan.name}
                        </h3>
                        <p 
                          className="text-sm opacity-80 leading-relaxed"
                        >
                          {customization.customDescription || plan.features[0] || 'Plan description'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold tracking-tight">K{plan.price.toLocaleString()}</span>
                      <span className="text-base opacity-70">/month</span>
                    </div>
                    
                    <Button 
                      className="w-full h-12 rounded-lg font-semibold" 
                      style={{
                        backgroundColor: isRecommended ? badgeColor : 'rgba(255, 255, 255, 0.1)',
                        color: isRecommended ? 'white' : cardTextColor,
                        border: isRecommended ? 'none' : '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      {customization.ctaText || 'Choose this plan'}
                    </Button>
                    
                    <div className="space-y-4 pt-2">
                      {plan.features.slice(1).map((feature, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div 
                            className="mt-0.5 rounded-full p-0.5"
                            style={{ backgroundColor: isRecommended ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)' }}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-sm opacity-90 leading-relaxed">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="px-6 py-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Customization</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
