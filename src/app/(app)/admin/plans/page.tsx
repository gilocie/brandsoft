

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useBrandsoft, type Plan } from '@/hooks/use-brandsoft';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { MoreHorizontal, PackagePlus, Briefcase, CheckCircle, Pencil, Trash2, KeyRound } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';


const premiumFeatures = [
    { id: 'fullTemplateEditor', label: 'Full Template Editor Access' },
    { id: 'removeBranding', label: 'Remove BrandSoft Branding' },
    { id: 'recurringInvoices', label: 'Recurring Invoices' },
    { id: 'apiAccess', label: 'API Access' },
    { id: 'aiContent', label: 'AI Content Generation' },
    { id: 'smartAnalytics', label: 'Smart Analytics' },
    { id: 'featuredListing', label: 'Featured Marketplace Listing' },
    { id: 'priorityAlerts', label: 'Priority Quotation Alerts' },
    { id: 'bulkOperations', label: 'Bulk Import/Export' },
    { id: 'partialPayments', label: 'Request Partial Payments' },
];

const newPlanSchema = z.object({
  name: z.string().min(2, "Plan name is required."),
  price: z.coerce.number().min(0, "Price must be a non-negative number."),
  features: z.array(z.string()).optional(),
});
type NewPlanFormData = z.infer<typeof newPlanSchema>;

export default function AdminPlansPage() {
    const { config, saveConfig } = useBrandsoft();
    const { toast } = useToast();
    const [isAddPlanOpen, setIsAddPlanOpen] = useState(false);
    const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);

    const plans = config?.plans || [];

    const newPlanForm = useForm<NewPlanFormData>({
        resolver: zodResolver(newPlanSchema),
        defaultValues: { name: '', price: 0, features: [] },
    });

    const onNewPlanSubmit = (data: NewPlanFormData) => {
        if (!config) return;

        const newPlan: Plan = {
            name: data.name,
            price: data.price,
            features: data.features || [],
        };

        const updatedPlans = [...(config.plans || []), newPlan];
        
        saveConfig({ ...config, plans: updatedPlans }, { redirect: false });

        toast({
            title: "Plan Created!",
            description: `The "${data.name}" plan has been successfully added.`,
        });
        
        setIsAddPlanOpen(false);
        newPlanForm.reset();
    };

    const handleEditPlan = (plan: Plan) => {
        newPlanForm.reset({
            name: plan.name,
            price: plan.price,
            features: plan.features,
        });
        setIsAddPlanOpen(true);
    };

    const handleDeletePlan = () => {
        if (!planToDelete || !config) return;
        const updatedPlans = plans.filter(p => p.name !== planToDelete.name);
        saveConfig({ ...config, plans: updatedPlans }, { redirect: false });
        toast({ title: `Plan "${planToDelete.name}" deleted` });
        setPlanToDelete(null); // This closes the dialog
    };

    return (
        <div className="container mx-auto space-y-8">
             <div>
                <h1 className="text-3xl font-bold font-headline">Plan & Pricing</h1>
                <p className="text-muted-foreground">Manage subscription plans and available features.</p>
            </div>
             <Tabs defaultValue="plans-list" className="w-full">
                <TabsList>
                    <TabsTrigger value="plans-list">Plans</TabsTrigger>
                    <TabsTrigger value="plan-features">Plan Features</TabsTrigger>
                    <TabsTrigger value="activation-keys">Activation Key Options</TabsTrigger>
                </TabsList>
                <TabsContent value="plans-list" className="pt-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Subscription Plans</CardTitle>
                                <CardDescription>Plans available for clients to purchase.</CardDescription>
                            </div>
                            <Dialog open={isAddPlanOpen} onOpenChange={setIsAddPlanOpen}>
                                <DialogTrigger asChild>
                                    <Button><PackagePlus className="mr-2 h-4 w-4" /> Add New Plan</Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle>Add New Plan</DialogTitle>
                                        <DialogDescription>
                                            Define a new subscription plan for your customers.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <Form {...newPlanForm}>
                                        <form onSubmit={newPlanForm.handleSubmit(onNewPlanSubmit)} className="pt-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    <FormField control={newPlanForm.control} name="name" render={({ field }) => (
                                                        <FormItem><FormLabel>Plan Name</FormLabel><FormControl><Input placeholder="e.g., Business Pro" {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                    <FormField control={newPlanForm.control} name="price" render={({ field }) => (
                                                        <FormItem><FormLabel>Price (per month)</FormLabel><FormControl><Input type="number" placeholder="25000" {...field} /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                </div>
                                                <FormField
                                                    control={newPlanForm.control}
                                                    name="features"
                                                    render={() => (
                                                        <FormItem>
                                                            <div className="mb-4">
                                                                <FormLabel className="text-base">Features</FormLabel>
                                                                <FormDescription>Select the features for this plan.</FormDescription>
                                                            </div>
                                                            <div className="space-y-2">
                                                                {premiumFeatures.map((item) => (
                                                                    <FormField
                                                                        key={item.id}
                                                                        control={newPlanForm.control}
                                                                        name="features"
                                                                        render={({ field }) => (
                                                                            <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                                                                                <FormControl>
                                                                                    <Checkbox
                                                                                        checked={field.value?.includes(item.id)}
                                                                                        onCheckedChange={(checked) => (
                                                                                            checked
                                                                                                ? field.onChange([...(field.value || []), item.id])
                                                                                                : field.onChange(field.value?.filter((value) => value !== item.id))
                                                                                        )}
                                                                                    />
                                                                                </FormControl>
                                                                                <FormLabel className="text-sm font-normal">{item.label}</FormLabel>
                                                                            </FormItem>
                                                                        )}
                                                                    />
                                                                ))}
                                                            </div>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <DialogFooter className="pt-6">
                                                <Button type="button" variant="outline" onClick={() => setIsAddPlanOpen(false)}>Cancel</Button>
                                                <Button type="submit">Save Plan</Button>
                                            </DialogFooter>
                                        </form>
                                    </Form>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">
                                {plans.map(plan => (
                                    <Card key={plan.name}>
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="flex items-center gap-2 text-xl">
                                                    <Briefcase className="h-5 w-5" />
                                                    {plan.name}
                                                </CardTitle>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent>
                                                        <DropdownMenuItem onSelect={() => handleEditPlan(plan)}>
                                                            <Pencil className="mr-2 h-4 w-4" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => setPlanToDelete(plan)} className="text-destructive focus:text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                            <CardDescription className="text-2xl font-bold pt-1">K{plan.price.toLocaleString()}/mo</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="space-y-2 text-sm text-muted-foreground">
                                                {plan.features.map(feature => (
                                                    <li key={feature} className="flex items-center gap-2">
                                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                                        <span>{premiumFeatures.find(f => f.id === feature)?.label || feature}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="plan-features" className="pt-4">
                     <Card>
                        <CardHeader>
                            <CardTitle>Premium Features</CardTitle>
                            <CardDescription>Manage features available for subscription plans.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {premiumFeatures.map(feature => (
                                    <div key={feature.id} className="flex items-center justify-between rounded-lg border p-3">
                                        <p className="text-sm font-medium">{feature.label}</p>
                                        <Switch />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="activation-keys" className="pt-4">
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" />Activation Key Options</CardTitle>
                            <CardDescription>Configure the benefits associated with new client activation keys.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed">
                                <p className="text-muted-foreground">Activation key settings coming soon.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
             <AlertDialog open={!!planToDelete} onOpenChange={(open) => !open && setPlanToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{planToDelete?.name}" Plan?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the subscription plan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setPlanToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeletePlan} className="bg-destructive hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

