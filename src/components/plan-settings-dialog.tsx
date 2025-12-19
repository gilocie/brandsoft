
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { SimpleImageUploadButton } from './simple-image-upload-button';
import type { Plan, PlanCustomization } from '@/hooks/use-brandsoft';

const planCustomizationSchema = z.object({
  planType: z.enum(['Standard', 'Premium', 'VIP', 'Once Off', 'Free Trial']).optional(),
  isRecommended: z.boolean().optional(),
  discountType: z.enum(['flat', 'percentage']).optional(),
  discountValue: z.coerce.number().optional(),
  titleColor: z.string().optional(),
  headerBgColor: z.string().optional(),
  footerBgColor: z.string().optional(),
  featureIconColor: z.string().optional(),
  priceColor: z.string().optional(),
  cardBgColor: z.string().optional(),
  cardBgImage: z.string().optional(),
  cardBgImageOpacity: z.number().min(0).max(1).optional(),
});

type PlanCustomizationFormData = z.infer<typeof planCustomizationSchema>;

interface PlanSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan | null;
  onSave: (planName: string, customization: PlanCustomization) => void;
}

const ColorInput = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
}) => (
  <div className="flex items-center gap-2">
    <Input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)} className="w-10 h-10 p-1"/>
    <div className="flex-1">
      <Label className="text-xs">{label}</Label>
      <Input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="#RRGGBB" />
    </div>
  </div>
);

export function PlanSettingsDialog({ isOpen, onClose, plan, onSave }: PlanSettingsDialogProps) {
  const form = useForm<PlanCustomizationFormData>({
    resolver: zodResolver(planCustomizationSchema),
  });

  useEffect(() => {
    if (plan) {
      form.reset(plan.customization || {});
    }
  }, [plan, form]);

  const onSubmit = (data: PlanCustomizationFormData) => {
    if (plan) {
      onSave(plan.name, data);
    }
  };

  if (!plan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Customize "{plan.name}" Plan</DialogTitle>
          <DialogDescription>
            Tailor the appearance and promotional details for this plan.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-grow overflow-hidden flex flex-col">
            <ScrollArea className="flex-1 pr-6 -mr-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Promotion */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="planType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plan Type / Tag</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Select a tag" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Standard">Standard</SelectItem>
                            <SelectItem value="Premium">Premium</SelectItem>
                            <SelectItem value="VIP">VIP</SelectItem>
                            <SelectItem value="Once Off">Once Off</SelectItem>
                            <SelectItem value="Free Trial">Free Trial</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isRecommended"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <FormLabel>Mark as Recommended</FormLabel>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2 pt-4">
                    <FormLabel>Promotional Discount</FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      <FormField
                        control={form.control}
                        name="discountType"
                        render={({ field }) => (
                          <FormItem>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="percentage">% Percentage</SelectItem>
                                <SelectItem value="flat">K Flat Amount</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="discountValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl><Input type="number" placeholder="e.g. 10" {...field} /></FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column - Styling */}
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <FormField name="titleColor" control={form.control} render={({ field }) => <ColorInput label="Title Color" {...field} />} />
                        <FormField name="priceColor" control={form.control} render={({ field }) => <ColorInput label="Price Color" {...field} />} />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <FormField name="headerBgColor" control={form.control} render={({ field }) => <ColorInput label="Header BG" {...field} />} />
                        <FormField name="footerBgColor" control={form.control} render={({ field }) => <ColorInput label="Footer BG" {...field} />} />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <FormField name="featureIconColor" control={form.control} render={({ field }) => <ColorInput label="Feature Icon" {...field} />} />
                        <FormField name="cardBgColor" control={form.control} render={({ field }) => <ColorInput label="Card BG Color" {...field} />} />
                    </div>
                    <FormField
                        name="cardBgImage"
                        control={form.control}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Card Background Image</FormLabel>
                                <SimpleImageUploadButton value={field.value} onChange={field.onChange} />
                            </FormItem>
                        )}
                    />
                    {form.watch('cardBgImage') && (
                        <FormField
                            name="cardBgImageOpacity"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>BG Image Opacity</FormLabel>
                                    <Input type="range" min="0" max="1" step="0.1" {...field} />
                                </FormItem>
                            )}
                        />
                    )}
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="flex-shrink-0 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Save Customization</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
