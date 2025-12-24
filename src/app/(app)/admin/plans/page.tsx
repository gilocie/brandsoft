

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useBrandsoft, type Plan, type AdminSettings, type PlanCustomization, type PlanPeriod, type Company } from '@/hooks/use-brandsoft';
import { usePlanImage } from '@/hooks/use-plan-image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { MoreHorizontal, PackagePlus, Briefcase, Check, Pencil, Trash2, KeyRound, TrendingUp, BarChart, AlertTriangle, Settings, Package, Users, HardDrive, Contact, Star, Gem, Crown, Award, Gift, Rocket, ShieldCheck, Loader2, TestTube2, Search, XCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { StatCard } from '@/components/office/stat-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlanSettingsDialog } from '@/components/plan-settings-dialog';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


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

const newPeriodSchema = z.object({
    value: z.string().min(1, "Value is required (e.g., '1', '6', 'once')"),
    label: z.string().min(1, "Label is required (e.g., '1 Month')")
});
type NewPeriodFormData = z.infer<typeof newPeriodSchema>;


const iconMap: { [key: string]: React.ElementType } = {
    Package, Users, HardDrive, Contact, Star, Gem, Crown, Award, Gift, Rocket, ShieldCheck,
};

const PlanIcon = ({ iconName, bgColor, iconColor }: { iconName?: string; bgColor?: string; iconColor?: string }) => {
    const Icon = iconName ? iconMap[iconName] : Package;
    return (
        <div 
            className="h-14 w-14 rounded-2xl flex items-center justify-center" 
            style={{ backgroundColor: bgColor || 'rgba(99, 102, 241, 0.15)' }}
        >
            <Icon style={{ color: iconColor || 'rgb(99, 102, 241)' }} className="h-7 w-7" />
        </div>
    )
};

const AdminPlanCard = ({ 
    plan, 
    onEdit, 
    onCustomize, 
    onDelete,
    onBuyClick
}: { 
    plan: Plan, 
    onEdit: () => void, 
    onCustomize: () => void, 
    onDelete: () => void,
    onBuyClick: () => void;
}) => {
    const { customization } = plan;
    const isPopular = customization?.isRecommended;
    
    const { image: headerImage, isLoading: isImageLoading } = usePlanImage(plan.name, 'header');

    const cardBgColor = customization?.bgColor || (isPopular ? 'rgb(88, 80, 236)' : 'rgb(30, 30, 35)');
    const cardTextColor = customization?.textColor || 'rgb(255, 255, 255)';
    const borderColor = customization?.borderColor || (isPopular ? 'rgb(88, 80, 236)' : 'rgb(45, 45, 50)');
    const badgeColor = customization?.badgeColor || 'rgb(255, 107, 53)';
    const badgeText = customization?.badgeText || 'Most popular';
    
    const backgroundStyle = customization?.backgroundType === 'gradient'
        ? { background: `linear-gradient(to bottom right, ${customization.backgroundGradientStart || '#3a3a3a'}, ${customization.backgroundGradientEnd || '#1a1a1a'})` }
        : { backgroundColor: cardBgColor };

    const displayHeaderImage = headerImage || customization?.headerBgImage;

    return (
        <Card
          className="flex flex-col h-full relative overflow-hidden transition-all duration-300 border-2"
          style={{
            ...backgroundStyle,
            borderColor: borderColor,
            color: cardTextColor
          }}
        >
            {isPopular && (
                 <div 
                    className="absolute top-6 right-6 text-xs font-bold px-3 py-1.5 rounded-full text-white z-10"
                    style={{ backgroundColor: badgeColor }}
                 >
                    {badgeText}
                </div>
            )}
             <div className="absolute top-2 right-2 z-20">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="h-8 w-8" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onSelect={onEdit}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onSelect={onCustomize}><Settings className="mr-2 h-4 w-4" /> Customize</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={onDelete} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
            </DropdownMenu>
            </div>
             <CardHeader 
                className="p-8 pb-6 relative" 
            >
                {displayHeaderImage && (
                    <>
                        {isImageLoading ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <Loader2 className="h-6 w-6 animate-spin text-white/50" />
                            </div>
                        ) : (
                            <>
                                <img 
                                    src={displayHeaderImage} 
                                    alt="Header background" 
                                    className="absolute inset-0 w-full h-full object-cover" 
                                />
                                <div 
                                    className="absolute inset-0 bg-black"
                                    style={{ opacity: 1 - (customization?.headerBgImageOpacity ?? 1) }}
                                />
                            </>
                        )}
                    </>
                )}
                 <div className="relative">
                    <div className="flex items-start gap-4 mb-6">
                        <PlanIcon 
                            iconName={customization?.icon}
                            bgColor={isPopular ? 'rgba(255, 255, 255, 0.15)' : undefined}
                            iconColor={isPopular ? 'rgb(255, 255, 255)' : undefined}
                        />
                        <div className="flex-1">
                            <CardTitle className="text-2xl font-bold mb-2" style={{ color: cardTextColor }}>
                                {customization?.customTitle || plan.name}
                            </CardTitle>
                            <CardDescription 
                                className="text-sm leading-relaxed"
                                style={{ color: isPopular ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.6)' }}
                            >
                                {customization?.customDescription || plan.features[0]}
                            </CardDescription>
                        </div>
                    </div>
                    
                    {customization?.hidePrice ? (
                        <div className="h-[60px] flex items-center">
                            <Button className="bg-white/90 text-black hover:bg-white w-full font-semibold" onClick={onBuyClick}>Contact Us</Button>
                        </div>
                    ) : (
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-bold tracking-tight" style={{ color: cardTextColor }}>
                                K{plan.price.toLocaleString()}
                            </span>
                            <span 
                                className="text-base font-medium"
                                style={{ color: isPopular ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.5)' }}
                            >
                                /month
                            </span>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-4 px-8 pb-8">
                 <div className="space-y-4 pt-2">
                    {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-3">
                            <div 
                                className="mt-0.5 rounded-full p-0.5"
                                style={{ backgroundColor: isPopular ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)' }}
                            >
                                <Check className="h-3.5 w-3.5" style={{ color: cardTextColor }} />
                            </div>
                            <span 
                                className="text-sm leading-relaxed flex-1"
                                style={{ color: isPopular ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.7)' }}
                            >
                                {feature}
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

const ClientPicker = ({
    onSelect,
    onClose,
    clients
}: {
    onSelect: (client: Company) => void;
    onClose: () => void;
    clients: Company[]
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredClients = useMemo(() => {
        if (!searchTerm) return clients;
        return clients.filter(client =>
            client.companyName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [clients, searchTerm]);

    return (
        <div>
            <DialogHeader>
                <DialogTitle>Select Client for Demo Mode</DialogTitle>
                <DialogDescription>
                    The demo plan durations will only apply to this client.
                </DialogDescription>
            </DialogHeader>
             <div className="py-4 space-y-4">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search clients..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                 </div>
                 <ScrollArea className="h-72">
                    <div className="space-y-2 pr-4">
                        {filteredClients.map(client => (
                            <div key={client.id} className="flex items-center justify-between p-2 rounded-md border hover:bg-muted cursor-pointer" onClick={() => onSelect(client)}>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={client.logo} />
                                        <AvatarFallback>{client.companyName.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <p className="text-sm font-medium">{client.companyName}</p>
                                </div>
                                <Button size="sm" variant="ghost">Select</Button>
                            </div>
                        ))}
                    </div>
                 </ScrollArea>
             </div>
        </div>
    )
}


export default function AdminPlansPage() {
    const { config, saveConfig, updatePurchaseStatus } = useBrandsoft();
    const { toast } = useToast();
    const [isAddPlanOpen, setIsAddPlanOpen] = useState(false);
    const [planToEdit, setPlanToEdit] = useState<Plan | null>(null);
    const [planToCustomize, setPlanToCustomize] = useState<Plan | null>(null);
    const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
    const [periodToDelete, setPeriodToDelete] = useState<PlanPeriod | null>(null);
    const [isResetRevenueOpen, setIsResetRevenueOpen] = useState(false);
    
    const [contactInfo, setContactInfo] = useState<{ planName: string, email?: string, whatsapp?: string } | null>(null);
    
    // DEMO MODE STATE
    const [isClientPickerOpen, setIsClientPickerOpen] = useState(false);
    const adminSettings = useMemo(() => config?.admin, [config]);

    const plans = useMemo(() => config?.plans || [], [config]);
    const planPeriods = useMemo(() => adminSettings?.planPeriods || [], [adminSettings]);
    const allClients = useMemo(() => config?.companies || [], [config?.companies]);

    const demoClientId = adminSettings?.demoClientId || null;
    const demoDurations = useMemo(() => adminSettings?.demoDurations || {}, [adminSettings?.demoDurations]);

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
    
    const newPeriodForm = useForm<NewPeriodFormData>({
        resolver: zodResolver(newPeriodSchema),
        defaultValues: { value: '', label: ''},
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
        setPlanToDelete(null);
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
        
        const cleanCustomization: PlanCustomization = {
            ...customization,
            headerBgImage: customization.headerBgImage ? 'indexed-db' : '',
        };
        
        const updatedPlans = (config.plans || []).map(p =>
            p.name === planName ? { ...p, customization: cleanCustomization } : p
        );
        
        saveConfig({ ...config, plans: updatedPlans }, { redirect: false });
        setPlanToCustomize(null);
    };
    
    const onNewPeriodSubmit = (data: NewPeriodFormData) => {
        if (!config || !config.admin) return;
        
        const newPeriods = [...(config.admin.planPeriods || []), data];
        saveConfig({ ...config, admin: { ...config.admin, planPeriods: newPeriods } }, { revalidate: false, redirect: false });
        newPeriodForm.reset({ value: '', label: '' });
        toast({ title: 'Plan Period Added', description: `"${data.label}" has been added.`});
    };
    
    const handleDeletePeriod = () => {
        if (!config || !config.admin || !periodToDelete) return;
        
        const newPeriods = (config.admin.planPeriods || []).filter(p => p.value !== periodToDelete.value);
        saveConfig({ ...config, admin: { ...config.admin, planPeriods: newPeriods } }, { revalidate: false });
        setPeriodToDelete(null);
        toast({ title: 'Plan Period Removed', description: `"${periodToDelete.label}" has been removed.`});
    };

    const trendingPlan = adminSettings?.trendingPlan || 'None';
    const keysSold = adminSettings?.keysSold || 0;
    const totalFromKeys = adminSettings?.revenueFromKeys || 0;
    const totalFromPlans = adminSettings?.revenueFromPlans || 0;
    
    // DEMO LOGIC
    const handleDemoToggle = (checked: boolean) => {
        if (!config) return;
        if (checked) {
            setIsClientPickerOpen(true);
        } else {
             saveConfig({ ...config, admin: { ...config.admin, demoClientId: null, demoStartedAt: null } }, { redirect: false, revalidate: true });
             updatePurchaseStatus(); // Force re-evaluation
        }
    };
    
    const handleSelectDemoClient = (client: Company) => {
        if (!config) return;
        saveConfig({ ...config, admin: { ...config.admin, demoClientId: client.id, demoStartedAt: new Date().toISOString() } }, { redirect: false, revalidate: true });
        setIsClientPickerOpen(false);
        updatePurchaseStatus(); // Force re-evaluation
        toast({ title: 'Demo Mode Activated', description: `Demo settings are now active for ${client.companyName}.` });
    };

    const handleDemoDurationChange = (planName: string, field: 'value' | 'unit', value: string | number) => {
        if (!config || !config.admin) return;
        
        const newDurations = {
            ...(config.admin.demoDurations || {}),
            [planName]: {
                ...(config.admin.demoDurations?.[planName] || { value: 10, unit: 'minutes' }),
                [field]: value
            }
        };

        saveConfig({ ...config, admin: { ...config.admin, demoDurations: newDurations } }, { redirect: false, revalidate: true });
    };
    
    useEffect(() => {
        if (!adminSettings?.demoClientId) return;
    
        const demoDurations = adminSettings.demoDurations || {};
        const hasSecondsUnit = Object.values(demoDurations).some(d => d.unit === 'seconds');
        const hasMinutesUnit = Object.values(demoDurations).some(d => d.unit === 'minutes');
    
        let intervalMs = 60000; // Default: 1 minute
        if (hasSecondsUnit) {
            intervalMs = 1000; // Every second
        } else if (hasMinutesUnit) {
            intervalMs = 5000; // Every 5 seconds for smoother minute countdown
        }
    
        const interval = setInterval(() => {
            updatePurchaseStatus();
        }, intervalMs);
    
        updatePurchaseStatus();
    
        return () => clearInterval(interval);
    }, [adminSettings?.demoClientId, adminSettings?.demoDurations, updatePurchaseStatus]);


    const demoClient = useMemo(() => {
        if (!demoClientId) return null;
        return allClients.find(c => c.id === demoClientId);
    }, [demoClientId, allClients]);


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
                    <TabsTrigger value="demo"><TestTube2 className="mr-2 h-4 w-4"/>Demo</TabsTrigger>
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
                           <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {plans.map(plan => (
                                    <AdminPlanCard 
                                        key={plan.name} 
                                        plan={plan}
                                        onEdit={() => handleEditPlan(plan)}
                                        onCustomize={() => setPlanToCustomize(plan)}
                                        onDelete={() => setPlanToDelete(plan)}
                                        onBuyClick={() => setContactInfo({ planName: plan.name, email: plan.customization?.contactEmail, whatsapp: plan.customization?.contactWhatsapp })}
                                    />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="plan-features" className="pt-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        <Card>
                            <CardHeader>
                                <CardTitle>Plan Periods</CardTitle>
                                <CardDescription>Manage the billing periods available for selection.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Form {...newPeriodForm}>
                                    <form onSubmit={newPeriodForm.handleSubmit(onNewPeriodSubmit)} className="flex items-end gap-2 mb-4">
                                        <FormField control={newPeriodForm.control} name="label" render={({ field }) => (
                                            <FormItem className="flex-1"><FormLabel>Label</FormLabel><FormControl><Input placeholder="e.g., 1 Year" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={newPeriodForm.control} name="value" render={({ field }) => (
                                            <FormItem className="flex-1"><FormLabel>Value</FormLabel><FormControl><Input placeholder="e.g., 12 or 'once'" {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <Button type="submit" size="sm"><PackagePlus className="h-4 w-4" /></Button>
                                    </form>
                                </Form>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Label</TableHead>
                                            <TableHead>Value</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {planPeriods.map(period => (
                                            <TableRow key={period.value}>
                                                <TableCell>{period.label}</TableCell>
                                                <TableCell>{period.value}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPeriodToDelete(period)}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
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
                <TabsContent value="demo" className="pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Demo Mode Configuration</CardTitle>
                            <CardDescription>
                               Temporarily override plan durations for a specific client. Changes here are not saved and only affect your current session.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base" htmlFor="demo-mode-switch">
                                        {demoClientId ? `Demo Mode Active for: ${demoClient?.companyName}` : 'Enable Demo Mode'}
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        {demoClientId ? 'Custom plan durations are active for this client.' : 'Select a client to apply demo settings.'}
                                    </p>
                                </div>
                                <Switch
                                    id="demo-mode-switch"
                                    checked={!!demoClientId}
                                    onCheckedChange={handleDemoToggle}
                                />
                                {demoClientId && (
                                    <Button variant="ghost" size="icon" className="h-8 w-8 ml-2" onClick={() => handleDemoToggle(false)}>
                                        <XCircle className="h-5 w-5 text-destructive" />
                                    </Button>
                                )}
                            </div>

                            <div className="space-y-4">
                                {plans.map((plan) => (
                                    <div key={plan.name} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-lg border p-4">
                                        <p className="font-medium flex-1">{plan.name}</p>
                                        <div className="flex items-center gap-2">
                                            <Input 
                                                type="number" 
                                                value={demoDurations[plan.name]?.value ?? 10}
                                                onChange={(e) => handleDemoDurationChange(plan.name, 'value', parseInt(e.target.value))}
                                                className="w-20"
                                                disabled={!demoClientId}
                                            />
                                            <Select 
                                                value={demoDurations[plan.name]?.unit || 'minutes'}
                                                onValueChange={(value) => handleDemoDurationChange(plan.name, 'unit', value)}
                                                disabled={!demoClientId}
                                            >
                                                <SelectTrigger className="w-[120px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="seconds">Seconds</SelectItem>
                                                    <SelectItem value="minutes">Minutes</SelectItem>
                                                    <SelectItem value="days">Days</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                ))}
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
            <AlertDialog open={!!periodToDelete} onOpenChange={(open) => !open && setPeriodToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{periodToDelete?.label}" Period?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove the period from the purchase options. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setPeriodToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeletePeriod} className="bg-destructive hover:bg-destructive/90">
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
            <Dialog open={isClientPickerOpen} onOpenChange={setIsClientPickerOpen}>
                <DialogContent>
                    <ClientPicker
                        clients={allClients}
                        onSelect={handleSelectDemoClient}
                        onClose={() => setIsClientPickerOpen(false)}
                    />
                </DialogContent>
            </Dialog>
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
