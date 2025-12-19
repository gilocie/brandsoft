'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette, Type, Sparkles } from 'lucide-react';
import type { Plan, PlanCustomization } from '@/hooks/use-brandsoft';

interface PlanSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan | null;
  onSave: (planName: string, customization: PlanCustomization) => void;
}

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
      onClose();
    }
  };

  const handleChange = (key: keyof PlanCustomization, value: string | undefined) => {
    setCustomization(prev => ({ ...prev, [key]: value }));
  };

  if (!plan) return null;

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
              <Tabs defaultValue="colors" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="colors">
                    <Palette className="h-4 w-4 mr-2" />
                    Colors
                  </TabsTrigger>
                  <TabsTrigger value="text">
                    <Type className="h-4 w-4 mr-2" />
                    Text
                  </TabsTrigger>
                  <TabsTrigger value="badge">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Badge
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="colors" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Color Scheme</CardTitle>
                      <CardDescription>Customize the colors for this plan's card</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="bgColor">Background Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="bgColor"
                            type="color"
                            value={customization.bgColor || '#ffffff'}
                            onChange={(e) => handleChange('bgColor', e.target.value)}
                            className="w-20 h-10"
                          />
                          <Input
                            type="text"
                            value={customization.bgColor || '#ffffff'}
                            onChange={(e) => handleChange('bgColor', e.target.value)}
                            placeholder="#ffffff"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="textColor">Text Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="textColor"
                            type="color"
                            value={customization.textColor || '#000000'}
                            onChange={(e) => handleChange('textColor', e.target.value)}
                            className="w-20 h-10"
                          />
                          <Input
                            type="text"
                            value={customization.textColor || '#000000'}
                            onChange={(e) => handleChange('textColor', e.target.value)}
                            placeholder="#000000"
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
                            value={customization.borderColor || '#e5e7eb'}
                            onChange={(e) => handleChange('borderColor', e.target.value)}
                            className="w-20 h-10"
                          />
                          <Input
                            type="text"
                            value={customization.borderColor || '#e5e7eb'}
                            onChange={(e) => handleChange('borderColor', e.target.value)}
                            placeholder="#e5e7eb"
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
                        <Input
                          id="customTitle"
                          value={customization.customTitle || ''}
                          onChange={(e) => handleChange('customTitle', e.target.value)}
                          placeholder={plan.name}
                        />
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
                          placeholder="Get Started"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="badge" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Badge Settings</CardTitle>
                      <CardDescription>Add a promotional badge to this plan</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="badgeText">Badge Text</Label>
                        <Input
                          id="badgeText"
                          value={customization.badgeText || ''}
                          onChange={(e) => handleChange('badgeText', e.target.value)}
                          placeholder="Popular, Best Value, etc."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="badgeColor">Badge Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="badgeColor"
                            type="color"
                            value={customization.badgeColor || '#ef4444'}
                            onChange={(e) => handleChange('badgeColor', e.target.value)}
                            className="w-20 h-10"
                          />
                          <Input
                            type="text"
                            value={customization.badgeColor || '#ef4444'}
                            onChange={(e) => handleChange('badgeColor', e.target.value)}
                            placeholder="#ef4444"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Preview Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>See how your customizations will look</CardDescription>
                </CardHeader>
                <CardContent>
                  <div 
                    className="border-2 rounded-lg p-6 text-center space-y-4"
                    style={{
                      backgroundColor: customization.bgColor || '#ffffff',
                      borderColor: customization.borderColor || '#e5e7eb',
                      color: customization.textColor || '#000000',
                    }}
                  >
                    {customization.badgeText && (
                      <div className="flex justify-center">
                        <span 
                          className="text-xs font-bold px-3 py-1 rounded-full text-white"
                          style={{ backgroundColor: customization.badgeColor || '#ef4444' }}
                        >
                          {customization.badgeText}
                        </span>
                      </div>
                    )}
                    <h3 className="text-2xl font-bold">
                      {customization.customTitle || plan.name}
                    </h3>
                    {customization.customDescription && (
                      <p className="text-sm opacity-80">{customization.customDescription}</p>
                    )}
                    <div className="text-3xl font-bold">K{plan.price.toLocaleString()}/mo</div>
                    <Button style={{ backgroundColor: customization.bgColor || '#000000' }}>
                      {customization.ctaText || 'Get Started'}
                    </Button>
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
