'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCanvasStore } from '@/stores/canvas-store';
import { useBrandsoft } from '@/hooks/use-brandsoft';
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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const templateSchema = z.object({
  name: z.string().min(3, { message: 'Template name must be at least 3 characters.' }),
  description: z.string().optional(),
  category: z.enum(['invoice', 'quotation', 'certificate', 'id-card', 'marketing']),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface SaveTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SaveTemplateDialog = ({ isOpen, onClose }: SaveTemplateDialogProps) => {
  const { pages, templateSettings } = useCanvasStore();
  const { config, saveConfig } = useBrandsoft();
  const { toast } = useToast();

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: '',
      description: '',
      category: 'invoice',
    },
  });

  const onSubmit = (data: TemplateFormData) => {
    if (!config) return;

    const updatedPages = pages.map(page => ({
        ...page,
        pageDetails: {
            ...page.pageDetails,
            ...templateSettings, // Save template settings into each page
        }
    }));

    const newTemplate = {
      id: `template-${Date.now()}`,
      name: data.name,
      description: data.description,
      category: data.category,
      pages: updatedPages,
      createdAt: new Date().toISOString(),
    };

    const newConfig = { ...config };
    if (!newConfig.templates) {
      newConfig.templates = [];
    }
    newConfig.templates.push(newTemplate);

    saveConfig(newConfig, { redirect: false });

    toast({
      title: 'Template Saved!',
      description: `"${data.name}" has been saved successfully.`,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
          <DialogDescription>
            Save your current design as a reusable template.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Modern Corporate Invoice" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="A brief description of the template." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="invoice">Invoice</SelectItem>
                      <SelectItem value="quotation">Quotation</SelectItem>
                      <SelectItem value="certificate">Certificate</SelectItem>
                      <SelectItem value="id-card">ID Card</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Save Template</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default SaveTemplateDialog;
