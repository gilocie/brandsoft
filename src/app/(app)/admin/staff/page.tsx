
'use client';

import { useState, useMemo } from 'react';
import { useBrandsoft, type Affiliate } from '@/hooks/use-brandsoft';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { AffiliateCard } from '@/components/affiliate/affiliate-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AdminStaffPage() {
    const { config, saveConfig } = useBrandsoft();
    const { toast } = useToast();
    
    const [affiliateToActOn, setAffiliateToActOn] = useState<Affiliate | null>(null);
    const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const affiliates = useMemo(() => (config?.affiliate ? [config.affiliate] : []), [config?.affiliate]);
    
    const handleSelectAction = (action: 'deactivate' | 'delete', affiliate: Affiliate) => {
        setAffiliateToActOn(affiliate);
        if (action === 'deactivate') setIsDeactivateOpen(true);
        if (action === 'delete') setIsDeleteOpen(true);
    };

    const handleDeactivateAffiliate = () => {
        if (affiliateToActOn) {
            console.log(`Deactivating ${affiliateToActOn.fullName}`);
            toast({ title: 'Affiliate Deactivated' });
            setIsDeactivateOpen(false);
        }
    };

    const handleDeleteAffiliate = () => {
        if (config && affiliateToActOn) {
             const newConfig = { ...config, affiliate: undefined };
             saveConfig(newConfig, { redirect: false });
             toast({ title: 'Affiliate Deleted' });
             setIsDeleteOpen(false);
        }
    };

    return (
        <div className="container mx-auto space-y-6">
             <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Staff Management</h1>
                    <p className="text-muted-foreground">Manage your registered affiliate partners.</p>
                </div>
                <Button variant="ghost" asChild>
                    <Link href="/admin"><ArrowLeft className="mr-2 h-4 w-4"/> Back to Dashboard</Link>
                </Button>
            </div>
            
             <Card>
                <CardHeader>
                    <CardTitle>Affiliates</CardTitle>
                    <CardDescription>Your registered affiliate partners.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {affiliates.map(affiliate => (
                        <AffiliateCard 
                            key={affiliate.username} 
                            affiliate={affiliate} 
                            onSelectAction={(action) => handleSelectAction(action, affiliate)}
                        />
                    ))}
                    {affiliates.length === 0 && (
                         <div className="col-span-full flex h-40 items-center justify-center rounded-lg border-2 border-dashed">
                            <p className="text-muted-foreground">No affiliates found.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={isDeactivateOpen} onOpenChange={setIsDeactivateOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Deactivate {affiliateToActOn?.fullName}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will temporarily suspend their account and prevent them from earning commissions. Are you sure?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeactivateAffiliate}>Deactivate</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {affiliateToActOn?.fullName}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action is irreversible and will permanently remove this affiliate from your system.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAffiliate} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
