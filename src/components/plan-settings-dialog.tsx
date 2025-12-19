
'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { Card, CardContent } from '@/components/ui/card';
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
  EyeOff,
  Settings2,
  Monitor,
  Tablet,
  Smartphone,
  Trash2,
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
import { Badge } from './ui/badge';

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

// Image Uploader Component with persistence
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
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = useCallback(
    (file: File) => {
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          onChange(result);
        };
        reader.readAsDataURL(file);
      }
    },
    [onChange]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemove = () => {
    onChange('');
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{label}</Label>
      <div
        className={cn(
          'relative flex items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200',
          aspect === 'wide' ? 'h-24' : 'h-36',
          isDragging
            ? 'border-primary bg-primary/5'
            : value
              ? 'border-transparent bg-transparent p-0'
              : 'border-muted-foreground/25 bg-muted/30 hover:border-muted-foreground/50 hover:bg-muted/50'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {value ? (
          <div className="group relative h-full w-full overflow-hidden rounded-xl">
            <img
              src={value}
              alt={`${label} preview`}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => inputRef.current?.click()}
              >
                <UploadCloud className="mr-2 h-4 w-4" />
                Replace
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleRemove}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="flex cursor-pointer flex-col items-center gap-2 text-muted-foreground"
            onClick={() => inputRef.current?.click()}
          >
            <div className="rounded-full bg-muted p-3">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">
                {isDragging ? 'Drop image here' : 'Click or drag to upload'}
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG up to 5MB
              </p>
            </div>
          </div>
        )}
      </div>
      <Input
        type="file"
        accept="image/*"
        className="hidden"
        ref={inputRef}
        onChange={handleInputChange}
      />
    </div>
  );
};

// Settings Section Component
const SettingsSection = ({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn('space-y-4 rounded-xl border bg-card/50 p-4', className)}>
    {title && (
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
    )}
    {children}
  </div>
);

// Form Field Component
const FormField = ({
  label,
  children,
  description,
  horizontal = false,
}: {
  label: string;
  children: React.ReactNode;
  description?: string;
  horizontal?: boolean;
}) => (
  <div
    className={cn(
      horizontal
        ? 'flex items-center justify-between gap-4'
        : 'space-y-2'
    )}
  >
    <div className={cn(horizontal ? 'flex-1' : '')}>
      <Label className="text-sm font-medium">{label}</Label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
    {children}
  </div>
);

// Color Picker Component
const ColorPicker = ({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (val: string) => void;
  label?: string;
}) => (
  <div className="space-y-1.5">
    {label && (
      <Label className="text-xs text-muted-foreground">{label}</Label>
    )}
    <div className="flex gap-2">
      <div className="relative">
        <Input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 cursor-pointer overflow-hidden rounded-lg border-2 p-0"
          style={{ backgroundColor: value }}
        />
      </div>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#000000"
        className="flex-1 font-mono text-xs uppercase"
      />
    </div>
  </div>
);

// Preview Device Selector
type DeviceType = 'mobile' | 'tablet' | 'desktop';

const DeviceSelector = ({
  device,
  onChange,
}: {
  device: DeviceType;
  onChange: (device: DeviceType) => void;
}) => (
  <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-1">
    <Button
      variant={device === 'mobile' ? 'secondary' : 'ghost'}
      size="sm"
      className="h-8 w-8 p-0"
      onClick={() => onChange('mobile')}
    >
      <Smartphone className="h-4 w-4" />
    </Button>
    <Button
      variant={device === 'tablet' ? 'secondary' : 'ghost'}
      size="sm"
      className="h-8 w-8 p-0"
      onClick={() => onChange('tablet')}
    >
      <Tablet className="h-4 w-4" />
    </Button>
    <Button
      variant={device === 'desktop' ? 'secondary' : 'ghost'}
      size="sm"
      className="h-8 w-8 p-0"
      onClick={() => onChange('desktop')}
    >
      <Monitor className="h-4 w-4" />
    </Button>
  </div>
);

// Plan Preview Card Component
const PlanPreviewCard = ({
  plan,
  customization,
  deviceType,
}: {
  plan: Plan;
  customization: PlanCustomization;
  deviceType: DeviceType;
}) => {
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

  const cardWidth =
    deviceType === 'mobile'
      ? 'w-[280px]'
      : deviceType === 'tablet'
        ? 'w-[320px]'
        : 'w-[360px]';

  const cardPadding =
    deviceType === 'mobile' ? 'p-4' : deviceType === 'tablet' ? 'p-5' : 'p-6';

  const iconSize =
    deviceType === 'mobile'
      ? 'h-10 w-10'
      : deviceType === 'tablet'
        ? 'h-11 w-11'
        : 'h-12 w-12';

  const titleSize =
    deviceType === 'mobile'
      ? 'text-base'
      : deviceType === 'tablet'
        ? 'text-lg'
        : 'text-xl';

  const priceSize =
    deviceType === 'mobile'
      ? 'text-2xl'
      : deviceType === 'tablet'
        ? 'text-3xl'
        : 'text-4xl';

  return (
    <Card
      className={cn(
        'relative space-y-4 rounded-2xl border-2 transition-all duration-300',
        cardWidth,
        cardPadding
      )}
      style={{
        ...backgroundStyle,
        borderColor,
        color: cardTextColor,
      }}
    >
      {/* Badge */}
      {isRecommended && badgeText && (
        <div className="absolute right-3 top-3 sm:right-4 sm:top-4">
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg sm:text-xs"
            style={{ backgroundColor: badgeColor }}
          >
            {badgeText}
          </span>
        </div>
      )}

      {/* Header with Background Image */}
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
              opacity: 1 - (customization.headerBgImageOpacity ?? 1),
            }}
          />
        )}
        <div
          className={cn(
            'relative',
            customization?.headerBgImage ? 'p-3' : 'p-0'
          )}
        >
          <div className="mb-4 flex items-start gap-3">
            <div
              className={cn(
                'flex flex-shrink-0 items-center justify-center rounded-xl',
                iconSize
              )}
              style={{
                backgroundColor: isRecommended
                  ? 'rgba(255, 255, 255, 0.15)'
                  : 'rgba(99, 102, 241, 0.15)',
              }}
            >
              <Icon
                className={cn(
                  deviceType === 'mobile' ? 'h-5 w-5' : 'h-6 w-6'
                )}
                style={{
                  color: isRecommended ? '#FFFFFF' : 'rgb(99, 102, 241)',
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className={cn('truncate font-bold', titleSize)}>
                {customization.customTitle || plan.name}
              </h3>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed opacity-80 sm:text-sm">
                {customization.customDescription ||
                  plan.features[0] ||
                  'Plan description'}
              </p>
            </div>
          </div>

          {/* Price */}
          {customization.hidePrice ? (
            <div className="flex h-12 items-center sm:h-14">
              <span
                className={cn('font-bold', deviceType === 'mobile' ? 'text-xl' : 'text-2xl')}
              >
                Contact us
              </span>
            </div>
          ) : (
            <div className="flex items-baseline gap-1.5">
              <span className={cn('font-bold tracking-tight', priceSize)}>
                K{plan.price.toLocaleString()}
              </span>
              <span className="text-sm opacity-70">/month</span>
            </div>
          )}
        </div>
      </div>

      {/* CTA Button */}
      <Button
        className={cn(
          'w-full rounded-xl font-semibold transition-all hover:scale-[1.02]',
          deviceType === 'mobile' ? 'h-10' : 'h-11'
        )}
        style={{
          backgroundColor: isRecommended
            ? badgeColor
            : 'rgba(255, 255, 255, 0.1)',
          color: isRecommended ? 'white' : cardTextColor,
          border: isRecommended ? 'none' : '1px solid rgba(255, 255, 255, 0.15)',
        }}
      >
        {customization.hidePrice
          ? 'Contact Us'
          : customization.ctaText || 'Choose this plan'}
      </Button>

      {/* Features */}
      <div className="space-y-2.5 pt-2 sm:space-y-3">
        {plan.features.slice(1, deviceType === 'mobile' ? 4 : 6).map((feature, index) => (
          <div key={index} className="flex items-start gap-2.5 sm:gap-3">
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
        {plan.features.length > (deviceType === 'mobile' ? 4 : 6) && (
          <p className="pt-1 text-center text-xs opacity-60">
            +{plan.features.length - (deviceType === 'mobile' ? 4 : 6)} more features
          </p>
        )}
      </div>
    </Card>
  );
};

export function PlanSettingsDialog({
  isOpen,
  onClose,
  plan,
  onSave,
}: PlanSettingsDialogProps) {
  const [customization, setCustomization] = useState<PlanCustomization>({});
  const [activeView, setActiveView] = useState<'settings' | 'preview'>('settings');
  const [previewDevice, setPreviewDevice] = useState<DeviceType>('desktop');

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
  const Icon = customization.icon ? iconMap[customization.icon] : Package;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-full max-w-[100vw] flex-col gap-0 overflow-hidden rounded-none border-0 p-0 sm:h-[95dvh] sm:max-h-[95dvh] sm:max-w-[95vw] sm:rounded-2xl sm:border md:max-w-6xl lg:max-w-7xl">
        {/* Header */}
        <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex items-center gap-3">
              <div className="hidden h-10 w-10 items-center justify-center rounded-xl bg-primary/10 sm:flex">
                <Settings2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold sm:text-lg">
                  Customize &ldquo;{plan.name}&rdquo;
                </DialogTitle>
                <DialogDescription className="hidden text-sm sm:block">
                  Personalize the appearance and messaging
                </DialogDescription>
              </div>
            </div>

            {/* Mobile View Toggle */}
            <div className="flex items-center gap-2 lg:hidden">
              <Button
                variant={activeView === 'settings' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveView('settings')}
                className="gap-2"
              >
                <Settings2 className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
              <Button
                variant={activeView === 'preview' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setActiveView('preview')}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">Preview</span>
              </Button>
            </div>

            {/* Desktop Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hidden h-9 w-9 lg:flex"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Settings Panel */}
          <div
            className={cn(
              'flex w-full flex-col border-r bg-muted/30 lg:w-[45%] xl:w-[40%]',
              activeView === 'preview' && 'hidden lg:flex'
            )}
          >
            <ScrollArea className="flex-1">
              <div className="p-4 sm:p-6">
                <Tabs defaultValue="promo" className="w-full">
                  <TabsList className="mb-6 grid w-full grid-cols-4 bg-background/80">
                    <TabsTrigger
                      value="promo"
                      className="gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-sm"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Promo</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="colors"
                      className="gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-sm"
                    >
                      <Palette className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Style</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="text"
                      className="gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-sm"
                    >
                      <Type className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Text</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="icon"
                      className="gap-1.5 text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground sm:text-sm"
                    >
                      <Star className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Icon</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Promo Tab */}
                  <TabsContent value="promo" className="mt-0 space-y-4">
                    <SettingsSection title="Highlight Settings">
                      <FormField
                        label="Mark as Recommended"
                        description="Highlight this plan to attract attention"
                        horizontal
                      >
                        <Switch
                          checked={customization.isRecommended || false}
                          onCheckedChange={(checked) =>
                            handleChange('isRecommended', checked)
                          }
                        />
                      </FormField>
                    </SettingsSection>

                    <SettingsSection title="Badge">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-sm">Badge Text</Label>
                          <Input
                            value={customization.badgeText || ''}
                            onChange={(e) =>
                              handleChange('badgeText', e.target.value)
                            }
                            placeholder="e.g., Popular, Best Value"
                          />
                        </div>
                        <ColorPicker
                          label="Badge Color"
                          value={customization.badgeColor || '#FF6B35'}
                          onChange={(v) => handleChange('badgeColor', v)}
                        />
                      </div>
                    </SettingsSection>

                    <SettingsSection title="Discount Settings">
                      <div className="space-y-4">
                        <FormField
                          label="Discount Type"
                          description="Choose percentage or flat amount"
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
                                className="w-12"
                              >
                                %
                              </ToggleGroupItem>
                              <ToggleGroupItem value="flat" className="w-12">
                                K
                              </ToggleGroupItem>
                            </ToggleGroup>
                            <Input
                              type="number"
                              value={customization.discountValue || ''}
                              onChange={(e) =>
                                handleChange(
                                  'discountValue',
                                  e.target.value
                                    ? Number(e.target.value)
                                    : undefined
                                )
                              }
                              placeholder="Discount amount"
                              className="flex-1"
                            />
                          </div>
                        </FormField>

                        <FormField
                          label="Minimum Subscription"
                          description="Months required for discount"
                        >
                          <Input
                            type="number"
                            value={customization.discountMonths || ''}
                            onChange={(e) =>
                              handleChange(
                                'discountMonths',
                                e.target.value
                                  ? Number(e.target.value)
                                  : undefined
                              )
                            }
                            placeholder="e.g., 3"
                          />
                        </FormField>
                      </div>
                    </SettingsSection>
                  </TabsContent>

                  {/* Colors Tab */}
                  <TabsContent value="colors" className="mt-0 space-y-4">
                    <SettingsSection title="Background">
                      <FormField label="Background Type">
                        <ToggleGroup
                          type="single"
                          value={customization.backgroundType || 'solid'}
                          onValueChange={(value: 'solid' | 'gradient') =>
                            handleChange('backgroundType', value)
                          }
                          className="grid grid-cols-2"
                        >
                          <ToggleGroupItem value="solid" className="gap-2">
                            <div className="h-4 w-4 rounded bg-primary" />
                            Solid
                          </ToggleGroupItem>
                          <ToggleGroupItem value="gradient" className="gap-2">
                            <div className="h-4 w-4 rounded bg-gradient-to-r from-primary to-purple-500" />
                            Gradient
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </FormField>

                      {customization.backgroundType === 'gradient' ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                          <ColorPicker
                            label="Start Color"
                            value={
                              customization.backgroundGradientStart || '#3a3a3a'
                            }
                            onChange={(v) =>
                              handleChange('backgroundGradientStart', v)
                            }
                          />
                          <ColorPicker
                            label="End Color"
                            value={
                              customization.backgroundGradientEnd || '#1a1a1a'
                            }
                            onChange={(v) =>
                              handleChange('backgroundGradientEnd', v)
                            }
                          />
                        </div>
                      ) : (
                        <ColorPicker
                          label="Background Color"
                          value={
                            customization.bgColor ||
                            (isRecommended ? '#5850EC' : '#1E1E23')
                          }
                          onChange={(v) => handleChange('bgColor', v)}
                        />
                      )}
                    </SettingsSection>

                    <SettingsSection title="Colors">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <ColorPicker
                          label="Text Color"
                          value={customization.textColor || '#FFFFFF'}
                          onChange={(v) => handleChange('textColor', v)}
                        />
                        <ColorPicker
                          label="Border Color"
                          value={
                            customization.borderColor ||
                            (isRecommended ? '#5850EC' : '#2D2D32')
                          }
                          onChange={(v) => handleChange('borderColor', v)}
                        />
                      </div>
                    </SettingsSection>

                    <SettingsSection title="Header Image">
                      <ImageUploader
                        label="Background Image"
                        value={customization.headerBgImage}
                        onChange={(v) => handleChange('headerBgImage', v)}
                        aspect="wide"
                      />
                      {customization.headerBgImage && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm">Image Opacity</Label>
                            <Badge variant="secondary" className="font-mono">
                              {Math.round(
                                (customization.headerBgImageOpacity ?? 1) * 100
                              )}
                              %
                            </Badge>
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
                            className="py-2"
                          />
                        </div>
                      )}
                    </SettingsSection>
                  </TabsContent>

                  {/* Text Tab */}
                  <TabsContent value="text" className="mt-0 space-y-4">
                    <SettingsSection title="Price Display">
                      <FormField
                        label="Hide Price"
                        description='Show "Contact us" instead of the price'
                        horizontal
                      >
                        <Switch
                          checked={customization.hidePrice || false}
                          onCheckedChange={(checked) =>
                            handleChange('hidePrice', checked)
                          }
                        />
                      </FormField>
                    </SettingsSection>

                    <SettingsSection title="Custom Text">
                      <div className="space-y-4">
                        <FormField label="Title">
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
                      </div>
                    </SettingsSection>
                  </TabsContent>

                  {/* Icon Tab */}
                  <TabsContent value="icon" className="mt-0 space-y-4">
                    <SettingsSection title="Plan Icon">
                      <FormField
                        label="Select Icon"
                        description="Choose an icon to represent this plan"
                      >
                        <Select
                          value={customization.icon || 'Package'}
                          onValueChange={(v) => handleChange('icon', v)}
                        >
                          <SelectTrigger className="h-11">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                <Icon className="h-4 w-4 text-primary" />
                              </div>
                              <SelectValue placeholder="Select icon" />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(iconMap).map((iconName) => {
                              const IconComponent = iconMap[iconName];
                              return (
                                <SelectItem key={iconName} value={iconName}>
                                  <div className="flex items-center gap-3">
                                    <IconComponent className="h-4 w-4" />
                                    <span>{iconName}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </FormField>

                      {/* Icon Preview Grid */}
                      <div className="mt-4">
                        <Label className="mb-3 block text-sm">Quick Select</Label>
                        <div className="grid grid-cols-6 gap-2">
                          {Object.keys(iconMap).map((iconName) => {
                            const IconComponent = iconMap[iconName];
                            const isSelected =
                              (customization.icon || 'Package') === iconName;
                            return (
                              <Button
                                key={iconName}
                                variant={isSelected ? 'default' : 'outline'}
                                size="icon"
                                className="h-10 w-full"
                                onClick={() => handleChange('icon', iconName)}
                              >
                                <IconComponent className="h-4 w-4" />
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    </SettingsSection>
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>
          </div>

          {/* Preview Panel */}
          <div
            className={cn(
              'flex flex-1 flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950',
              activeView === 'settings' && 'hidden lg:flex'
            )}
          >
            {/* Preview Header */}
            <div className="flex flex-shrink-0 items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-300">
                  Live Preview
                </span>
              </div>
              <DeviceSelector device={previewDevice} onChange={setPreviewDevice} />
            </div>

            {/* Scrollable Preview Area */}
            <ScrollArea className="flex-1">
              <div className="flex min-h-full items-center justify-center p-6 sm:p-8 lg:p-12">
                <div
                  className={cn(
                    'transition-all duration-300',
                    previewDevice === 'mobile' && 'scale-100',
                    previewDevice === 'tablet' && 'scale-95 sm:scale-100',
                    previewDevice === 'desktop' && 'scale-90 sm:scale-95 lg:scale-100'
                  )}
                >
                  <PlanPreviewCard
                    plan={plan}
                    customization={customization}
                    deviceType={previewDevice}
                  />
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
            <p className="hidden text-sm text-muted-foreground lg:block">
              Changes will be applied when you save.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 gap-2 sm:flex-none"
              >
                <Check className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
