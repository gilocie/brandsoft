

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useBrandsoft, type Plan, type AdminSettings, type PlanCustomization } from '@/hooks/use-brandsoft';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { MoreHorizontal, PackagePlus, Briefcase, CheckCircle, Pencil, Trash2, KeyRound, TrendingUp, BarChart, AlertTriangle, Settings } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { StatCard } from '@/components/office/stat-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlanSettingsDialog } from '@/components/plan-settings-dialog';


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
  invoiceLimit: z.coerce.number().int().min(0).optional(),
  unlimitedInvoices: z.boolean().default(false),
  quotationLimit: z.coerce.number().int().min(0).optional(),
  unlimitedQuotations: z.boolean().default(false),
  productLimit: z.coerce.number().int().min(0).optional(),
  unlimitedProducts: z.boolean().default(false),
  customerLimit: z.coerce.number().int().min(0).optional(),
  unlimitedCustomers: z.boolean().default(false),
  features: z.array(z.string()).optional(),
});

type NewPlanFormData = z.infer<typeof newPlanSchema>;

const activationKeySchema = z.object({
  keyPrice: z.coerce.number().min(0, "Price must be non-negative."),
  keyFreeDays: z.coerce.number().int().min(0, "Free days must be a non-negative integer."),
  keyPeriodReserveDays: z.coerce.number().int().min(0, "Paid days must be a non-negative integer."),
  keyUsageLimit: z.coerce.number().int().min(1, "Usage limit must be at least 1."),
});
type ActivationKeyFormData = z.infer<typeof activationKeySchema>;

export default function AdminPlansPage() {
    const { config, saveConfig } = useBrandsoft();
    const { toast } = useToast();
    const [isAddPlanOpen, setIsAddPlanOpen] = useState(false);
    const [planToEdit, setPlanToEdit] = useState<Plan | null>(null);
    const [planToCustomize, setPlanToCustomize] = useState<Plan | null>(null);
    const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
    const [isResetRevenueOpen, setIsResetRevenueOpen] = useState(false);

    const plans = config?.plans || [];
    const adminSettings = config?.admin;

    const newPlanForm = useForm<NewPlanFormData>({
        resolver: zodResolver(newPlanSchema),
        defaultValues: {
          name: '',
          price: 0,
          invoiceLimit: 10,
          unlimitedInvoices: false,
          quotationLimit: 10,
          unlimitedQuotations: false,
          productLimit: 10,
          unlimitedProducts: false,
          customerLimit: 10,
          unlimitedCustomers: false,
          features: [],
        },
    });

    const watchUnlimited = newPlanForm.watch([
        'unlimitedInvoices', 
        'unlimitedQuotations', 
        'unlimitedProducts', 
        'unlimitedCustomers'
    ]);
    
    const activationKeyForm = useForm<ActivationKeyFormData>({
        resolver: zodResolver(activationKeySchema),
        defaultValues: {
            keyPrice: adminSettings?.keyPrice || 5000,
            keyFreeDays: adminSettings?.keyFreeDays || 30,
            keyPeriodReserveDays: adminSettings?.keyPeriodReserveDays || 30,
            keyUsageLimit: adminSettings?.keyUsageLimit || 1,
        }
    });
    
     useEffect(() => {
        if (adminSettings) {
            activationKeyForm.reset({
                keyPrice: adminSettings.keyPrice || 5000,
                keyFreeDays: adminSettings.keyFreeDays || 30,
                keyPeriodReserveDays: adminSettings.keyPeriodReserveDays || 30,
                keyUsageLimit: adminSettings.keyUsageLimit || 1,
            });
        }
    }, [adminSettings, activationKeyForm]);


    const onNewPlanSubmit = (data: NewPlanFormData) => {
        if (!config) return;
        
        const baseFeatures = [];
        baseFeatures.push(data.unlimitedInvoices ? 'Unlimited Invoices' : `${data.invoiceLimit || 0} Invoices`);
        baseFeatures.push(data.unlimitedQuotations ? 'Unlimited Quotations' : `${data.quotationLimit || 0} Quotations`);
        baseFeatures.push(data.unlimitedProducts ? 'Unlimited Products' : `${data.productLimit || 0} Products`);
        baseFeatures.push(data.unlimitedCustomers ? 'Unlimited Customers' : `${data.customerLimit || 0} Customers`);

        const selectedPremiumFeatures = data.features?.map(featureId => {
            return premiumFeatures.find(f => f.id === featureId)?.label || featureId;
        }) || [];
        
        const planToSave: Omit<Plan, 'customization'> = {
            name: data.name,
            price: data.price,
            features: [...baseFeatures, ...selectedPremiumFeatures],
        };

        let updatedPlans: Plan[];
        const existingPlanIndex = plans.findIndex(p => p.name === planToEdit?.name);

        if (existingPlanIndex > -1) {
            // Preserve existing customization when editing
            const existingCustomization = plans[existingPlanIndex].customization;
            updatedPlans = [...plans];
            updatedPlans[existingPlanIndex] = { ...planToSave, customization: existingCustomization };
        } else {
            updatedPlans = [...(config.plans || []), { ...planToSave, customization: {} }];
        }
        
        saveConfig({ ...config, plans: updatedPlans }, { redirect: false });

        toast({
            title: `Plan ${existingPlanIndex > -1 ? 'Updated' : 'Created'}!`,
            description: `The "${data.name}" plan has been successfully saved.`,
        });
        
        setIsAddPlanOpen(false);
        newPlanForm.reset();
        setPlanToEdit(null);
    };

    const handleEditPlan = (plan: Plan) => {
        setPlanToEdit(plan);
        const getLimit = (featureName: string) => {
            const feature = plan.features.find(f => f.toLowerCase().includes(featureName));
            if (!feature) return { limit: 0, unlimited: false };
            if (feature.toLowerCase().includes('unlimited')) return { limit: 0, unlimited: true };
            return { limit: parseInt(feature.split(' ')[0]) || 0, unlimited: false };
        };

        const invoice = getLimit('invoice');
        const quotation = getLimit('quotation');
        const product = getLimit('product');
        const customer = getLimit('customer');

        const premiumFeatureIds = plan.features.map(f => {
            const prem = premiumFeatures.find(pf => pf.label === f);
            return prem ? prem.id : null;
        }).filter((id): id is string => id !== null);

        newPlanForm.reset({
            name: plan.name,
            price: plan.price,
            invoiceLimit: invoice.limit,
            unlimitedInvoices: invoice.unlimited,
            quotationLimit: quotation.limit,
            unlimitedQuotations: quotation.unlimited,
            productLimit: product.limit,
            unlimitedProducts: product.unlimited,
            customerLimit: customer.limit,
            unlimitedCustomers: customer.unlimited,
            features: premiumFeatureIds,
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
    
    const onActivationKeySubmit = (data: ActivationKeyFormData) => {
        if (!config) return;
        const newAdminSettings: AdminSettings = {
            ...(config.admin || {} as AdminSettings),
            ...data,
        };
        saveConfig({ ...config, admin: newAdminSettings }, { redirect: false });
        toast({
            title: "Activation Key Settings Saved",
            description: "Your settings for new keys have been updated.",
        });
    };
    
    const handleResetRevenue = () => {
        if (!config || !config.admin) return;

        const newAdminSettings: AdminSettings = {
            ...config.admin,
            revenueFromKeys: 0,
            revenueFromPlans: 0,
            keysSold: 0,
        };
        
        saveConfig({ ...config, admin: newAdminSettings }, { redirect: false, revalidate: true });
        toast({ title: 'Revenue Records Reset!', description: 'Revenue from keys and plans has been set to zero.' });
        setIsResetRevenueOpen(false);
    };
    
    const handleSaveCustomization = (planName: string, customization: PlanCustomization) => {
        if (!config) return;
        const updatedPlans = config.plans.map(p =>
            p.name === planName ? { ...p, customization } : p
        );
        saveConfig({ ...config, plans: updatedPlans }, {redirect: false});
        setPlanToCustomize(null);
    };

    const trendingPlan = adminSettings?.trendingPlan || 'None';
    const keysSold = adminSettings?.keysSold || 0;
    const totalFromKeys = adminSettings?.revenueFromKeys || 0;
    const totalFromPlans = adminSettings?.revenueFromPlans || 0;


    return (
        <div className="container mx-auto space-y-8">
             <div>
                <h1 className="text-3xl font-bold font-headline">Plan & Pricing</h1>
                <p className="text-muted-foreground">Manage subscription plans and available features.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Trending Plan" value={trendingPlan} icon={TrendingUp} footer="Most popular subscription" />
                <StatCard title="Keys Sold" value={keysSold} icon={KeyRound} footer="Total activation keys sold" />
                <StatCard title="Revenue from Keys" value={totalFromKeys} isCurrency icon={BarChart} footer="Lifetime key sales" />
                <StatCard title="Revenue from Plans" value={totalFromPlans} isCurrency icon={BarChart} footer="Lifetime plan sales" />
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
                            <Dialog open={isAddPlanOpen} onOpenChange={(open) => { setIsAddPlanOpen(open); if(!open) { setPlanToEdit(null); newPlanForm.reset(); } }}>
                                <DialogTrigger asChild>
                                    <Button><PackagePlus className="mr-2 h-4 w-4" /> Add New Plan</Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-3xl h-[90vh] flex flex-col">
                                    <DialogHeader>
                                        <DialogTitle>{planToEdit ? 'Edit' : 'Add New'} Plan</DialogTitle>
                                        <DialogDescription>
                                            Define a subscription plan for your customers.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <Form {...newPlanForm}>
                                        <form onSubmit={newPlanForm.handleSubmit(onNewPlanSubmit)} className="flex-grow flex flex-col min-h-0">
                                            <ScrollArea className="flex-grow pr-6 -mr-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                                    <div className="space-y-4">
                                                        <FormField control={newPlanForm.control} name="name" render={({ field }) => (
                                                            <FormItem><FormLabel>Plan Name</FormLabel><FormControl><Input placeholder="e.g., Business Pro" {...field} /></FormControl><FormMessage /></FormItem>
                                                        )} />
                                                        <FormField control={newPlanForm.control} name="price" render={({ field }) => (
                                                            <FormItem><FormLabel>Price (per month)</FormLabel><FormControl><Input type="number" placeholder="25000" {...field} /></FormControl><FormMessage /></FormItem>
                                                        )} />
                                                        
                                                         {/* Basic Limits */}
                                                        <div className="space-y-4 pt-4">
                                                            <LimitField control={newPlanForm.control} name="invoiceLimit" unlimitedName="unlimitedInvoices" label="Invoice Limit" disabled={watchUnlimited[0]}/>
                                                            <LimitField control={newPlanForm.control} name="quotationLimit" unlimitedName="unlimitedQuotations" label="Quotation Limit" disabled={watchUnlimited[1]}/>
                                                            <LimitField control={newPlanForm.control} name="productLimit" unlimitedName="unlimitedProducts" label="Product Limit" disabled={watchUnlimited[2]}/>
                                                            <LimitField control={newPlanForm.control} name="customerLimit" unlimitedName="unlimitedCustomers" label="Customer Limit" disabled={watchUnlimited[3]}/>
                                                        </div>

                                                    </div>
                                                    <FormField
                                                        control={newPlanForm.control}
                                                        name="features"
                                                        render={() => (
                                                            <FormItem>
                                                                <div className="mb-4">
                                                                    <FormLabel className="text-base">Premium Features</FormLabel>
                                                                    <FormDescription>Select the features for this plan.</FormDescription>
                                                                </div>
                                                                <ScrollArea className="h-72 rounded-md border p-2">
                                                                    <div className="space-y-2 p-2">
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
                                                                </ScrollArea>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </ScrollArea>
                                            <DialogFooter className="pt-6 flex-shrink-0">
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
                                    <Card key={plan.name} className="overflow-hidden">
                                        <CardHeader className="relative p-0 h-20">
                                            {plan.customization?.headerBgImage && (
                                                <img src={plan.customization.headerBgImage} alt={plan.name} className="w-full h-full object-cover" style={{ opacity: plan.customization.headerBgImageOpacity || 1 }} />
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
                                            <div className="absolute bottom-4 left-4">
                                                <CardTitle className="flex items-center gap-2 text-xl">
                                                    <Briefcase className="h-5 w-5" />
                                                    {plan.name}
                                                </CardTitle>
                                            </div>
                                            <div className="absolute top-2 right-2">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="secondary" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent>
                                                        <DropdownMenuItem onSelect={() => handleEditPlan(plan)}>
                                                            <Pencil className="mr-2 h-4 w-4" /> Edit
                                                        </DropdownMenuItem>
                                                         <DropdownMenuItem onSelect={() => setPlanToCustomize(plan)}>
                                                            <Settings className="mr-2 h-4 w-4" /> Customize
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onSelect={() => setPlanToDelete(plan)} className="text-destructive focus:text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-4">
                                             <CardDescription className="text-2xl font-bold pt-1">K{plan.price.toLocaleString()}/mo</CardDescription>
                                            <ul className="space-y-2 text-sm text-muted-foreground mt-4">
                                                {plan.features.map(feature => (
                                                    <li key={feature} className="flex items-center gap-2">
                                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                                        <span>{feature}</span>
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
                <TabsContent value="activation-keys" className="pt-4 space-y-6">
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" />Activation Key Options</CardTitle>
                            <CardDescription>Configure the benefits associated with new client activation keys.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Form {...activationKeyForm}>
                                <form onSubmit={activationKeyForm.handleSubmit(onActivationKeySubmit)} className="space-y-6">
                                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <FormField control={activationKeyForm.control} name="keyPrice" render={({ field }) => (
                                            <FormItem><FormLabel>Key Price</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>The cost for a staff member to generate a new key.</FormDescription><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={activationKeyForm.control} name="keyFreeDays" render={({ field }) => (
                                            <FormItem><FormLabel>Free Trial Days</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>Number of free premium days a new client receives.</FormDescription><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={activationKeyForm.control} name="keyPeriodReserveDays" render={({ field }) => (
                                            <FormItem><FormLabel>Paid Days</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>Paid days credited to client account after trial.</FormDescription><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={activationKeyForm.control} name="keyUsageLimit" render={({ field }) => (
                                            <FormItem><FormLabel>Key Usage Limit</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormDescription>How many times a single key can be used.</FormDescription><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                    <Button type="submit">Save Key Settings</Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5" />Danger Zone</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between p-4 border border-destructive/50 bg-destructive/5 rounded-lg">
                                <div>
                                    <h3 className="font-semibold">Reset Revenue Data</h3>
                                    <p className="text-sm text-muted-foreground">This will reset revenue from keys and plans, and the keys sold count to zero.</p>
                                </div>
                                 <AlertDialog open={isResetRevenueOpen} onOpenChange={setIsResetRevenueOpen}>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive">Reset Revenue</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will reset all revenue and sales counters for keys and plans. This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleResetRevenue} className="bg-destructive hover:bg-destructive/90">Yes, Reset Revenue</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
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
            <PlanSettingsDialog
                isOpen={!!planToCustomize}
                onClose={() => setPlanToCustomize(null)}
                plan={planToCustomize}
                onSave={handleSaveCustomization}
            />
        </div>
    );
}

const LimitField = ({
  control,
  name,
  unlimitedName,
  label,
  disabled
}: {
  control: any,
  name: keyof NewPlanFormData,
  unlimitedName: keyof NewPlanFormData,
  label: string,
  disabled: boolean,
}) => (
    <div className="space-y-2">
        <FormLabel>{label}</FormLabel>
        <div className="flex items-center gap-2">
            <FormField
                control={control}
                name={name}
                render={({ field }) => (
                    <FormItem className="flex-grow">
                        <FormControl>
                            <Input
                                type="number"
                                placeholder="10"
                                {...field}
                                disabled={disabled}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={control}
                name={unlimitedName}
                render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 pt-2">
                        <FormControl>
                            <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">Unlimited</FormLabel>
                    </FormItem>
                )}
            />
        </div>
    </div>
);
