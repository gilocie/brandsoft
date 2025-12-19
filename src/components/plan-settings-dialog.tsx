'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Palette, Type, Sparkles, Check, UploadCloud, ShieldCheck, Users, HardDrive, Contact, Star, Package, Gem, Crown, Award, Gift, Rocket } from 'lucide-react';
import type { Plan, PlanCustomization } from '@/hooks/use-brandsoft';
import { Switch } from './ui/switch';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const iconMap: { [key: string]: React.ElementType } = {
    Package, Users, HardDrive, Contact, Star, Gem, Crown, Award, Gift, Rocket, ShieldCheck,
};

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
            <Label className="text-xs font-medium">{label}</Label>
            <div className={`relative flex items-center justify-center rounded-md border border-dashed p-2 w-full ${aspect === 'wide' ? 'h-16' : 'h-32'}`}>
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
  const badgeColor = customization?.badgeColor || 'rgb(255, 107, 53)';
  const badgeText = customization?.badgeText || 'Popular';
  
  const backgroundStyle = customization?.backgroundType === 'gradient'
    ? { background: `linear-gradient(to bottom right, ${customization.backgroundGradientStart || '#3a3a3a'}, ${customization.backgroundGradientEnd || '#1a1a1a'})` }
    : { backgroundColor: customization.bgColor || (isRecommended ? 'rgb(88, 80, 236)' : 'rgb(30, 30, 35)') };

  const borderColor = customization?.borderColor || (isRecommended ? 'rgb(88, 80, 236)' : 'rgb(45, 45, 50)');
  const cardTextColor = customization?.textColor || 'rgb(255, 255, 255)';
  
  const Icon = customization.icon ? iconMap[customization.icon] : Package;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <DialogTitle>Customize "{plan.name}" Plan</DialogTitle>
          <DialogDescription>
            Personalize the appearance and messaging for this subscription plan.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0 gap-0">
          {/* Left side - Settings */}
          <div className="flex flex-col min-h-0">
            <ScrollArea className="flex-1">
              <div className="p-6">
                 <Tabs defaultValue="promo" className="w-full">
                      <TabsList className="grid w-full grid-cols-4 h-9">
                          <TabsTrigger value="promo" className="text-xs"><Sparkles className="h-3 w-3 mr-1" />Promo</TabsTrigger>
                          <TabsTrigger value="colors" className="text-xs"><Palette className="h-3 w-3 mr-1" />Style</TabsTrigger>
                          <TabsTrigger value="text" className="text-xs"><Type className="h-3 w-3 mr-1" />Text</TabsTrigger>
                          <TabsTrigger value="icon" className="text-xs"><Star className="h-3 w-3 mr-1" />Icon</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="promo" className="space-y-3 mt-4">
                          <Card>
                              <CardContent className="pt-4 space-y-3">
                              <div className="flex items-center justify-between rounded-lg border p-2.5">
                                  <div><Label htmlFor="isRecommended" className="font-medium text-sm">Mark as "Recommended"</Label><p className="text-xs text-muted-foreground">Highlight this plan</p></div>
                                  <Switch id="isRecommended" checked={customization.isRecommended || false} onCheckedChange={(checked) => handleChange('isRecommended', checked)} />
                              </div>
                              <div className="space-y-2">
                                  <Label className="text-xs font-medium">Badge</Label>
                                  <div className="grid grid-cols-2 gap-2">
                                      <Input value={customization.badgeText || ''} onChange={(e) => handleChange('badgeText', e.target.value)} placeholder="e.g., Popular" className="h-9 text-sm" />
                                      <Input type="color" value={customization.badgeColor || '#FF6B35'} onChange={(e) => handleChange('badgeColor', e.target.value)} className="w-full h-9"/>
                                  </div>
                              </div>
                              <div className="space-y-2">
                                  <Label className="text-xs font-medium">Discount</Label>
                                  <div className="flex gap-2">
                                      <ToggleGroup type="single" value={customization.discountType} onValueChange={(value: 'flat' | 'percentage') => handleChange('discountType', value)} className="border rounded-md">
                                          <ToggleGroupItem value="percentage" className="h-9 px-3 text-xs">%</ToggleGroupItem>
                                          <ToggleGroupItem value="flat" className="h-9 px-3 text-xs">K</ToggleGroupItem>
                                      </ToggleGroup>
                                      <Input type="number" value={customization.discountValue || ''} onChange={(e) => handleChange('discountValue', e.target.value ? Number(e.target.value) : undefined)} placeholder="Amount" className="flex-1 h-9 text-sm"/>
                                  </div>
                              </div>
                              <div className="space-y-2">
                                  <Label htmlFor="discountMonths" className="text-xs font-medium">Apply on orders ≥ (Months)</Label>
                                  <Input id="discountMonths" type="number" value={customization.discountMonths || ''} onChange={(e) => handleChange('discountMonths', e.target.value ? Number(e.target.value) : undefined)} placeholder="e.g., 3" className="h-9 text-sm"/>
                              </div>
                              </CardContent>
                          </Card>
                      </TabsContent>

                      <TabsContent value="colors" className="space-y-3 mt-4">
                          <Card>
                              <CardContent className="pt-4 space-y-3">
                                  <div className="space-y-2">
                                      <Label className="text-xs font-medium">Background Type</Label>
                                      <ToggleGroup type="single" value={customization.backgroundType || 'solid'} onValueChange={(value: 'solid' | 'gradient') => handleChange('backgroundType', value)} className="grid grid-cols-2">
                                          <ToggleGroupItem value="solid" className="text-xs">Solid</ToggleGroupItem>
                                          <ToggleGroupItem value="gradient" className="text-xs">Gradient</ToggleGroupItem>
                                      </ToggleGroup>
                                  </div>
                                  {customization.backgroundType === 'gradient' ? (
                                      <div className="grid grid-cols-2 gap-2">
                                          <div className="space-y-1.5">
                                              <Label className="text-xs">Start</Label>
                                              <Input type="color" value={customization.backgroundGradientStart || '#3a3a3a'} onChange={(e) => handleChange('backgroundGradientStart', e.target.value)} className="w-full h-9"/>
                                          </div>
                                          <div className="space-y-1.5">
                                              <Label className="text-xs">End</Label>
                                              <Input type="color" value={customization.backgroundGradientEnd || '#1a1a1a'} onChange={(e) => handleChange('backgroundGradientEnd', e.target.value)} className="w-full h-9"/>
                                          </div>
                                      </div>
                                  ) : (
                                      <div className="space-y-1.5">
                                          <Label htmlFor="bgColor" className="text-xs font-medium">Background</Label>
                                          <Input id="bgColor" type="color" value={customization.bgColor || (isRecommended ? '#5850EC' : '#1E1E23')} onChange={(e) => handleChange('bgColor', e.target.value)} className="w-full h-9"/>
                                      </div>
                                  )}
                                  <div className="grid grid-cols-2 gap-2">
                                      <div className="space-y-1.5">
                                          <Label htmlFor="textColor" className="text-xs">Text</Label>
                                          <Input id="textColor" type="color" value={customization.textColor || '#FFFFFF'} onChange={(e) => handleChange('textColor', e.target.value)} className="w-full h-9"/>
                                      </div>
                                      <div className="space-y-1.5">
                                          <Label htmlFor="borderColor" className="text-xs">Border</Label>
                                          <Input id="borderColor" type="color" value={customization.borderColor || (isRecommended ? '#5850EC' : '#2D2D32')} onChange={(e) => handleChange('borderColor', e.target.value)} className="w-full h-9"/>
                                      </div>
                                  </div>
                                  <ImageUploader label="Header Image" value={customization.headerBgImage} onChange={(v) => handleChange('headerBgImage', v)} aspect="wide" />
                                  {customization.headerBgImage && (
                                      <div className="space-y-1.5">
                                          <Label className="text-xs">Image Opacity: {Math.round((customization.headerBgImageOpacity ?? 1) * 100)}%</Label>
                                          <Slider value={[(customization.headerBgImageOpacity ?? 1) * 100]} onValueChange={([v]) => handleChange('headerBgImageOpacity', v / 100)} max={100} step={1} className="py-2"/>
                                      </div>
                                  )}
                              </CardContent>
                          </Card>
                      </TabsContent>

                      <TabsContent value="text" className="space-y-3 mt-4">
                          <Card>
                              <CardContent className="pt-4 space-y-3">
                                  <div className="flex items-center justify-between rounded-lg border p-2.5">
                                      <Label htmlFor="hidePrice" className="font-medium text-sm">Hide Price</Label>
                                      <Switch id="hidePrice" checked={customization.hidePrice || false} onCheckedChange={(checked) => handleChange('hidePrice', checked)} />
                                  </div>
                                  <div className="space-y-1.5">
                                      <Label htmlFor="customTitle" className="text-xs font-medium">Title</Label>
                                      <Input id="customTitle" value={customization.customTitle || ''} onChange={(e) => handleChange('customTitle', e.target.value)} placeholder={plan.name} className="h-9 text-sm"/>
                                  </div>
                                  <div className="space-y-1.5">
                                      <Label htmlFor="customDescription" className="text-xs font-medium">Description</Label>
                                      <Input id="customDescription" value={customization.customDescription || ''} onChange={(e) => handleChange('customDescription', e.target.value)} placeholder="Plan description..." className="h-9 text-sm"/>
                                  </div>
                                  <div className="space-y-1.5">
                                      <Label htmlFor="ctaText" className="text-xs font-medium">Button Text</Label>
                                      <Input id="ctaText" value={customization.ctaText || ''} onChange={(e) => handleChange('ctaText', e.target.value)} placeholder="Choose this plan" className="h-9 text-sm"/>
                                  </div>
                              </CardContent>
                          </Card>
                      </TabsContent>

                      <TabsContent value="icon" className="space-y-3 mt-4">
                          <Card>
                              <CardContent className="pt-4">
                                  <Label className="text-xs font-medium mb-2 block">Plan Icon</Label>
                                  <Select value={customization.icon || 'Package'} onValueChange={(v) => handleChange('icon', v)}>
                                      <SelectTrigger className="h-9">
                                          <div className="flex items-center gap-2">
                                              <Icon className="h-4 w-4" />
                                              <SelectValue placeholder="Select icon" />
                                          </div>
                                      </SelectTrigger>
                                      <SelectContent>
                                          {Object.keys(iconMap).map(iconName => (
                                              <SelectItem key={iconName} value={iconName}>
                                                  <div className="flex items-center gap-2">
                                                      {React.createElement(iconMap[iconName], { className: 'h-4 w-4' })}
                                                      {iconName}
                                                  </div>
                                              </SelectItem>
                                          ))}
                                      </SelectContent>
                                  </Select>
                              </CardContent>
                          </Card>
                      </TabsContent>
                  </Tabs>
              </div>
            </ScrollArea>
          </div>

          {/* Right side - Live Preview */}
          <div className="lg:col-span-1 bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center p-6 border-l">
            <div className="w-full max-w-xs">
                <p className="text-xs text-slate-400 mb-3 text-center">Live Preview</p>
                <Card
                    className="border-2 rounded-2xl p-5 space-y-4 text-left relative transition-all duration-300"
                    style={{ ...backgroundStyle, borderColor, color: cardTextColor }}
                >
                    {(isRecommended && badgeText) && (<div className="absolute top-4 right-4"><span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: badgeColor }}>{badgeText}</span></div>)}
                    
                    <div className="relative" style={{ backgroundImage: customization?.headerBgImage ? `url(${customization.headerBgImage})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                        {customization?.headerBgImage && <div className="absolute inset-0 bg-black rounded-t-xl" style={{opacity: 1 - (customization.headerBgImageOpacity ?? 1)}} />}
                        <div className="relative">
                            <div className="flex items-start gap-3 mb-4">
                                <div className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: isRecommended ? 'rgba(255, 255, 255, 0.15)' : 'rgba(99, 102, 241, 0.15)' }}>
                                    <Icon className="h-6 w-6" style={{ color: isRecommended ? '#FFFFFF' : 'rgb(99, 102, 241)' }} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold mb-1">{customization.customTitle || plan.name}</h3>
                                    <p className="text-xs opacity-80 leading-relaxed">{customization.customDescription || plan.features[0] || 'Plan description'}</p>
                                </div>
                            </div>
                            {customization.hidePrice ? (
                                <div className="h-[50px] flex items-center">
                                    <span className="text-2xl font-bold">Contact us</span>
                                </div>
                            ) : (
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-3xl font-bold tracking-tight">K{plan.price.toLocaleString()}</span>
                                    <span className="text-sm opacity-70">/month</span>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <Button className="w-full h-10 rounded-lg font-semibold text-sm" style={{ backgroundColor: isRecommended ? badgeColor : 'rgba(255, 255, 255, 0.1)', color: isRecommended ? 'white' : cardTextColor, border: isRecommended ? 'none' : '1px solid rgba(255, 255, 255, 0.1)' }}>
                        {customization.hidePrice ? 'Contact Us' : (customization.ctaText || 'Choose this plan')}
                    </Button>
                    
                    <div className="space-y-2.5 pt-1">
                        {plan.features.slice(1).map((feature, index) => (
                            <div key={index} className="flex items-start gap-2.5">
                                <div className="mt-0.5 rounded-full p-0.5" style={{ backgroundColor: isRecommended ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)' }}>
                                    <Check className="h-3 w-3" />
                                </div>
                                <span className="text-xs opacity-90 leading-relaxed">{feature}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-3 border-t flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="h-9">Cancel</Button>
          <Button onClick={handleSave} className="h-9">Save Customization</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
