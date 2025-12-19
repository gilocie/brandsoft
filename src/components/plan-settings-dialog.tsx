'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Palette,
  Type,
  Sparkles,
  Check,
  UploadCloud,
  ShieldCheck,
  Users,
  HardDrive,
  Contact,
  Star,
  Package,
  Gem,
  Crown,
  Award,
  Gift,
  Rocket,
  X,
  Eye,
} from 'lucide-react';
import type { Plan, PlanCustomization } from '@/hooks/use-brandsoft';
import { Switch } from './ui/switch';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { Slider } from './ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { cn } from '@/lib/utils';
import { Separator } from './ui/separator';

const iconMap: { [key: string]: React.ElementType } = {
  Package,
  Users,
  HardDrive,
  Contact,
  Star,
  Gem,
  Crown,
  Award,
  Gift,
  Rocket,
  ShieldCheck,
};

interface PlanSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan | null;
  onSave: (planName: string, customization: PlanCustomization) => void;
}

// Image Uploader Component
const ImageUploader = ({
  value,
  onChange,
  label,
  aspect,
}: {
  value?: string;
  onChange: (val: string) => void;
  label: string;
  aspect: 'wide' | 'normal';
}) => {
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

  const handleRemove = () => {
    onChange('');
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div
        className={cn(
          'relative flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 transition-colors hover:border-muted-foreground/50 hover:bg-muted/50',
          aspect === 'wide' ? 'h-20' : 'h-32'
        )}
      >
        {value ? (
          <div className="relative h-full w-full">
            <img
              src={value}
              alt={`${label} preview`}
              className="h-full w-full rounded-lg object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
              onClick={handleRemove}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <UploadCloud className="h-6 w-6" />
            <p className="text-xs">No image uploaded</p>
          </div>
        )}
      </div>
      <Input
        type="file"
        accept="image/*"
        className="hidden"
        ref={inputRef}
        onChange={handleFileChange}
      />
      {!value && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          className="w-full"
        >
          <UploadCloud className="mr-2 h-4 w-4" />
          Upload Image
        </Button>
      )}
    </div>
  );
};

// Settings Section Component
const SettingsSection = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn('space-y-4 rounded-lg border bg-card p-4', className)}>
    {children}
  </div>
);

// Form Field Component
const FormField = ({
  label,
  children,
  description,
}: {
  label: string;
  children: React.ReactNode;
  description?: string;
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <Label className="text-sm font-medium">{label}</Label>
    </div>
    {description && (
      <p className="text-xs text-muted-foreground">{description}</p>
    )}
    {children}
  </div>
);

export function PlanSettingsDialog({
  isOpen,
  onClose,
  plan,
  onSave,
}: PlanSettingsDialogProps) {
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
    setCustomization((prev) => ({ ...prev, [key]: value }));
  };

  if (!plan) return null;

  const isRecommended = customization.isRecommended;
  const badgeColor = customization?.badgeColor || 'rgb(255, 107, 53)';
  const badgeText = customization?.badgeText || 'Popular';

  const backgroundStyle =
    customization?.backgroundType === 'gradient'
      ? {
          background: `linear-gradient(to bottom right, ${customization.backgroundGradientStart || '#3a3a3a'}, ${customization.backgroundGradientEnd || '#1a1a1a'})`,
        }
      : {
          backgroundColor:
            customization.bgColor ||
            (isRecommended ? 'rgb(88, 80, 236)' : 'rgb(30, 30, 35)'),
        };

  const borderColor =
    customization?.borderColor ||
    (isRecommended ? 'rgb(88, 80, 236)' : 'rgb(45, 45, 50)');
  const cardTextColor = customization?.textColor || 'rgb(255, 255, 255)';

  const Icon = customization.icon ? iconMap[customization.icon] : Package;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex h-[85vh] max-h-[900px] max-w-5xl flex-col gap-0 overflow-hidden p-0">
        {/* Header - Fixed */}
        <div className="flex-shrink-0 border-b bg-background px-6 py-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              Customize &ldquo;{plan.name}&rdquo; Plan
            </DialogTitle>
            <DialogDescription className="text-sm">
              Personalize the appearance and messaging for this subscription
              plan.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Content - Scrollable */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Left Panel - Settings */}
          <div className="flex w-full flex-col border-r lg:w-1/2">
            <ScrollArea className="flex-1">
              <div className="p-6">
                <Tabs defaultValue="promo" className="w-full">
                  <TabsList className="mb-6 grid w-full grid-cols-4 bg-muted/50">
                    <TabsTrigger
                      value="promo"
                      className="gap-1.5 text-xs data-[state=active]:bg-background"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Promo</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="colors"
                      className="gap-1.5 text-xs data-[state=active]:bg-background"
                    >
                      <Palette className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Style</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="text"
                      className="gap-1.5 text-xs data-[state=active]:bg-background"
                    >
                      <Type className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Text</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="icon"
                      className="gap-1.5 text-xs data-[state=active]:bg-background"
                    >
                      <Star className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Icon</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Promo Tab */}
                  <TabsContent value="promo" className="mt-0 space-y-4">
                    <SettingsSection>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium">
                            Mark as Recommended
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Highlight this plan to attract attention
                          </p>
                        </div>
                        <Switch
                          checked={customization.isRecommended || false}
                          onCheckedChange={(checked) =>
                            handleChange('isRecommended', checked)
                          }
                        />
                      </div>
                    </SettingsSection>

                    <SettingsSection>
                      <FormField
                        label="Badge Settings"
                        description="Customize the promotional badge"
                      >
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">
                              Text
                            </Label>
                            <Input
                              value={customization.badgeText || ''}
                              onChange={(e) =>
                                handleChange('badgeText', e.target.value)
                              }
                              placeholder="e.g., Popular"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">
                              Color
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                type="color"
                                value={customization.badgeColor || '#FF6B35'}
                                onChange={(e) =>
                                  handleChange('badgeColor', e.target.value)
                                }
                                className="h-10 w-14 cursor-pointer p-1"
                              />
                              <Input
                                value={customization.badgeColor || '#FF6B35'}
                                onChange={(e) =>
                                  handleChange('badgeColor', e.target.value)
                                }
                                placeholder="#FF6B35"
                                className="flex-1 font-mono text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      </FormField>
                    </SettingsSection>

                    <SettingsSection>
                      <FormField
                        label="Discount"
                        description="Apply a discount to this plan"
                      >
                        <div className="flex gap-3">
                          <ToggleGroup
                            type="single"
                            value={customization.discountType || ''}
                            onValueChange={(value: 'flat' | 'percentage') =>
                              handleChange('discountType', value)
                            }
                            className="flex-shrink-0"
                          >
                            <ToggleGroupItem
                              value="percentage"
                              className="w-10"
                            >
                              %
                            </ToggleGroupItem>
                            <ToggleGroupItem value="flat" className="w-10">
                              K
                            </ToggleGroupItem>
                          </ToggleGroup>
                          <Input
                            type="number"
                            value={customization.discountValue || ''}
                            onChange={(e) =>
                              handleChange(
                                'discountValue',
                                e.target.value ? Number(e.target.value) : undefined
                              )
                            }
                            placeholder="Discount amount"
                            className="flex-1"
                          />
                        </div>
                      </FormField>

                      <FormField
                        label="Minimum Months"
                        description="Apply discount for orders with this many months or more"
                      >
                        <Input
                          type="number"
                          value={customization.discountMonths || ''}
                          onChange={(e) =>
                            handleChange(
                              'discountMonths',
                              e.target.value ? Number(e.target.value) : undefined
                            )
                          }
                          placeholder="e.g., 3"
                        />
                      </FormField>
                    </SettingsSection>
                  </TabsContent>

                  {/* Colors Tab */}
                  <TabsContent value="colors" className="mt-0 space-y-4">
                    <SettingsSection>
                      <FormField
                        label="Background Type"
                        description="Choose a solid color or gradient background"
                      >
                        <ToggleGroup
                          type="single"
                          value={customization.backgroundType || 'solid'}
                          onValueChange={(value: 'solid' | 'gradient') =>
                            handleChange('backgroundType', value)
                          }
                          className="grid grid-cols-2"
                        >
                          <ToggleGroupItem value="solid">
                            Solid Color
                          </ToggleGroupItem>
                          <ToggleGroupItem value="gradient">
                            Gradient
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </FormField>

                      {customization.backgroundType === 'gradient' ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">
                              Start Color
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                type="color"
                                value={
                                  customization.backgroundGradientStart ||
                                  '#3a3a3a'
                                }
                                onChange={(e) =>
                                  handleChange(
                                    'backgroundGradientStart',
                                    e.target.value
                                  )
                                }
                                className="h-10 w-14 cursor-pointer p-1"
                              />
                              <Input
                                value={
                                  customization.backgroundGradientStart ||
                                  '#3a3a3a'
                                }
                                onChange={(e) =>
                                  handleChange(
                                    'backgroundGradientStart',
                                    e.target.value
                                  )
                                }
                                className="flex-1 font-mono text-xs"
                              />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">
                              End Color
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                type="color"
                                value={
                                  customization.backgroundGradientEnd ||
                                  '#1a1a1a'
                                }
                                onChange={(e) =>
                                  handleChange(
                                    'backgroundGradientEnd',
                                    e.target.value
                                  )
                                }
                                className="h-10 w-14 cursor-pointer p-1"
                              />
                              <Input
                                value={
                                  customization.backgroundGradientEnd ||
                                  '#1a1a1a'
                                }
                                onChange={(e) =>
                                  handleChange(
                                    'backgroundGradientEnd',
                                    e.target.value
                                  )
                                }
                                className="flex-1 font-mono text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">
                            Background Color
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={
                                customization.bgColor ||
                                (isRecommended ? '#5850EC' : '#1E1E23')
                              }
                              onChange={(e) =>
                                handleChange('bgColor', e.target.value)
                              }
                              className="h-10 w-14 cursor-pointer p-1"
                            />
                            <Input
                              value={
                                customization.bgColor ||
                                (isRecommended ? '#5850EC' : '#1E1E23')
                              }
                              onChange={(e) =>
                                handleChange('bgColor', e.target.value)
                              }
                              placeholder="#1E1E23"
                              className="flex-1 font-mono text-xs"
                            />
                          </div>
                        </div>
                      )}
                    </SettingsSection>

                    <SettingsSection>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">
                            Text Color
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={customization.textColor || '#FFFFFF'}
                              onChange={(e) =>
                                handleChange('textColor', e.target.value)
                              }
                              className="h-10 w-14 cursor-pointer p-1"
                            />
                            <Input
                              value={customization.textColor || '#FFFFFF'}
                              onChange={(e) =>
                                handleChange('textColor', e.target.value)
                              }
                              className="flex-1 font-mono text-xs"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">
                            Border Color
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={
                                customization.borderColor ||
                                (isRecommended ? '#5850EC' : '#2D2D32')
                              }
                              onChange={(e) =>
                                handleChange('borderColor', e.target.value)
                              }
                              className="h-10 w-14 cursor-pointer p-1"
                            />
                            <Input
                              value={
                                customization.borderColor ||
                                (isRecommended ? '#5850EC' : '#2D2D32')
                              }
                              onChange={(e) =>
                                handleChange('borderColor', e.target.value)
                              }
                              className="flex-1 font-mono text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </SettingsSection>

                    <SettingsSection>
                      <ImageUploader
                        label="Header Background Image"
                        value={customization.headerBgImage}
                        onChange={(v) => handleChange('headerBgImage', v)}
                        aspect="wide"
                      />
                      {customization.headerBgImage && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm">Image Opacity</Label>
                            <span className="text-sm font-medium text-muted-foreground">
                              {Math.round(
                                (customization.headerBgImageOpacity ?? 1) * 100
                              )}
                              %
                            </span>
                          </div>
                          <Slider
                            value={[
                              (customization.headerBgImageOpacity ?? 1) * 100,
                            ]}
                            onValueChange={([v]) =>
                              handleChange('headerBgImageOpacity', v / 100)
                            }
                            max={100}
                            step={1}
                          />
                        </div>
                      )}
                    </SettingsSection>
                  </TabsContent>

                  {/* Text Tab */}
                  <TabsContent value="text" className="mt-0 space-y-4">
                    <SettingsSection>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium">
                            Hide Price
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Show &ldquo;Contact us&rdquo; instead of the price
                          </p>
                        </div>
                        <Switch
                          checked={customization.hidePrice || false}
                          onCheckedChange={(checked) =>
                            handleChange('hidePrice', checked)
                          }
                        />
                      </div>
                    </SettingsSection>

                    <SettingsSection>
                      <FormField label="Custom Title">
                        <Input
                          value={customization.customTitle || ''}
                          onChange={(e) =>
                            handleChange('customTitle', e.target.value)
                          }
                          placeholder={plan.name}
                        />
                      </FormField>

                      <FormField label="Description">
                        <Input
                          value={customization.customDescription || ''}
                          onChange={(e) =>
                            handleChange('customDescription', e.target.value)
                          }
                          placeholder="Plan description..."
                        />
                      </FormField>

                      <FormField label="Button Text">
                        <Input
                          value={customization.ctaText || ''}
                          onChange={(e) =>
                            handleChange('ctaText', e.target.value)
                          }
                          placeholder="Choose this plan"
                        />
                      </FormField>
                    </SettingsSection>
                  </TabsContent>

                  {/* Icon Tab */}
                  <TabsContent value="icon" className="mt-0 space-y-4">
                    <SettingsSection>
                      <FormField
                        label="Plan Icon"
                        description="Select an icon to represent this plan"
                      >
                        <Select
                          value={customization.icon || 'Package'}
                          onValueChange={(v) => handleChange('icon', v)}
                        >
                          <SelectTrigger>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <SelectValue placeholder="Select icon" />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(iconMap).map((iconName) => {
                              const IconComponent = iconMap[iconName];
                              return (
                                <SelectItem key={iconName} value={iconName}>
                                  <div className="flex items-center gap-2">
                                    <IconComponent className="h-4 w-4" />
                                    {iconName}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </FormField>
                    </SettingsSection>
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>
          </div>

          {/* Right Panel - Live Preview */}
          <div className="hidden flex-1 flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 lg:flex">
            <div className="flex flex-1 items-center justify-center p-8">
              <div className="w-full max-w-sm">
                <div className="mb-4 flex items-center justify-center gap-2">
                  <Eye className="h-4 w-4 text-slate-400" />
                  <p className="text-sm font-medium text-slate-400">
                    Live Preview
                  </p>
                </div>

                {/* Preview Card */}
                <Card
                  className="relative space-y-4 rounded-2xl border-2 p-6 transition-all duration-300"
                  style={{
                    ...backgroundStyle,
                    borderColor,
                    color: cardTextColor,
                  }}
                >
                  {/* Badge */}
                  {isRecommended && badgeText && (
                    <div className="absolute right-4 top-4">
                      <span
                        className="rounded-full px-3 py-1 text-xs font-bold text-white shadow-lg"
                        style={{ backgroundColor: badgeColor }}
                      >
                        {badgeText}
                      </span>
                    </div>
                  )}

                  {/* Header */}
                  <div
                    className="relative overflow-hidden rounded-xl"
                    style={{
                      backgroundImage: customization?.headerBgImage
                        ? `url(${customization.headerBgImage})`
                        : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    {customization?.headerBgImage && (
                      <div
                        className="absolute inset-0 bg-black"
                        style={{
                          opacity:
                            1 - (customization.headerBgImageOpacity ?? 1),
                        }}
                      />
                    )}
                    <div className="relative p-1">
                      <div className="mb-4 flex items-start gap-3">
                        <div
                          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl"
                          style={{
                            backgroundColor: isRecommended
                              ? 'rgba(255, 255, 255, 0.15)'
                              : 'rgba(99, 102, 241, 0.15)',
                          }}
                        >
                          <Icon
                            className="h-6 w-6"
                            style={{
                              color: isRecommended
                                ? '#FFFFFF'
                                : 'rgb(99, 102, 241)',
                            }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-lg font-bold">
                            {customization.customTitle || plan.name}
                          </h3>
                          <p className="line-clamp-2 text-xs leading-relaxed opacity-80">
                            {customization.customDescription ||
                              plan.features[0] ||
                              'Plan description'}
                          </p>
                        </div>
                      </div>

                      {/* Price */}
                      {customization.hidePrice ? (
                        <div className="flex h-[50px] items-center">
                          <span className="text-2xl font-bold">Contact us</span>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl font-bold tracking-tight">
                            K{plan.price.toLocaleString()}
                          </span>
                          <span className="text-sm opacity-70">/month</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Button
                    className="h-11 w-full rounded-xl font-semibold transition-all hover:scale-[1.02]"
                    style={{
                      backgroundColor: isRecommended
                        ? badgeColor
                        : 'rgba(255, 255, 255, 0.1)',
                      color: isRecommended ? 'white' : cardTextColor,
                      border: isRecommended
                        ? 'none'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    {customization.hidePrice
                      ? 'Contact Us'
                      : customization.ctaText || 'Choose this plan'}
                  </Button>

                  {/* Features */}
                  <div className="space-y-3 pt-2">
                    {plan.features.slice(1, 5).map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div
                          className="mt-0.5 flex-shrink-0 rounded-full p-1"
                          style={{
                            backgroundColor: isRecommended
                              ? 'rgba(255, 255, 255, 0.2)'
                              : 'rgba(255, 255, 255, 0.1)',
                          }}
                        >
                          <Check className="h-3 w-3" />
                        </div>
                        <span className="text-sm leading-relaxed opacity-90">
                          {feature}
                        </span>
                      </div>
                    ))}
                    {plan.features.length > 5 && (
                      <p className="text-center text-xs opacity-60">
                        +{plan.features.length - 5} more features
                      </p>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="flex-shrink-0 border-t bg-background px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="hidden text-sm text-muted-foreground sm:block">
              Changes will be applied immediately after saving
            </p>
            <div className="flex w-full gap-3 sm:w-auto">
              <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
                Cancel
              </Button>
              <Button onClick={handleSave} className="flex-1 sm:flex-none">
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}