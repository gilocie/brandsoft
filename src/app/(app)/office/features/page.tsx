
'use client';

import { useBrandsoft, type Affiliate, type Transaction } from '@/hooks/use-brandsoft';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, KeyRound, Phone, PlusCircle, Banknote, Smartphone, Wallet } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { VerificationItem } from '@/components/office/verification-item';
import { MethodCard } from '@/components/office/method-card';
import { SetPinDialog } from '@/components/office/dialogs/set-pin-dialog';
import { SecurityQuestionsDialog, type SecurityQuestionFormData } from '@/components/office/dialogs/security-questions-dialog';
import { WithdrawalMethodDialog, type WithdrawalMethodFormData, type EditableWithdrawalMethod } from '@/components/office/dialogs/withdrawal-method-dialog';
import { BankWithdrawalDialog, type BankWithdrawalFormData } from '@/components/office/dialogs/bank-withdrawal-dialog';
import { BsCreditsDialog, type BsCreditsFormData } from '@/components/office/dialogs/bs-credits-dialog';

export default function FeaturesPage() {
    const { config, saveConfig } = useBrandsoft();
    const { toast } = useToast();
    
    const [editingMethod, setEditingMethod] = useState<EditableWithdrawalMethod | null>(null);
    const [isBankDialogOpen, setIsBankDialogOpen] = useState(false);
    const [isBsCreditsDialogOpen, setIsBsCreditsDialogOpen] = useState(false);
    const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
    const [isSecurityQuestionsOpen, setIsSecurityQuestionsOpen] = useState(false);

    const affiliate = config?.affiliate;

    if (!affiliate || !config) {
        return <div>Loading...</div>;
    }

    const generateNewStaffId = () => {
        if (!config || !affiliate) return;
    
        const randomDigits = Math.floor(10000000 + Math.random() * 90000000).toString();
        const newStaffId = `BS-AFF-${randomDigits}`;
        
        saveConfig({ ...config, affiliate: { ...affiliate, staffId: newStaffId } }, { redirect: false });
        
        toast({
            title: "New Staff ID Generated!",
            description: "Your new staff ID has been saved.",
        });
    };

    const handleSaveWithdrawalMethod = (method: EditableWithdrawalMethod, data: WithdrawalMethodFormData) => {
        if (!config || !affiliate) return;
    
        const newAffiliateData = { ...affiliate };
        if (!newAffiliateData.withdrawalMethods) {
            newAffiliateData.withdrawalMethods = {};
        }
        newAffiliateData.withdrawalMethods[method] = data;
    
        saveConfig({ ...config, affiliate: newAffiliateData }, { redirect: false, revalidate: true });
        toast({ title: `${method.toUpperCase()} Details Saved!`});
        setEditingMethod(null);
    };

    const handleSaveBankDetails = (data: BankWithdrawalFormData) => {
        if (!config || !affiliate) return;
        const newAffiliateData = { ...affiliate };
        if (!newAffiliateData.withdrawalMethods) {
            newAffiliateData.withdrawalMethods = {};
        }
        newAffiliateData.withdrawalMethods.bank = data;
        saveConfig({ ...config, affiliate: newAffiliateData }, { redirect: false, revalidate: true });
        toast({ title: "Bank Details Saved!" });
        setIsBankDialogOpen(false);
    };

    const handleSaveBsCredits = (data: BsCreditsFormData) => {
        if (!config || !affiliate) return;
        const newAffiliateData = { ...affiliate };
        if (!newAffiliateData.withdrawalMethods) {
            newAffiliateData.withdrawalMethods = {};
        }
        newAffiliateData.withdrawalMethods.bsCredits = data;
        saveConfig({ ...config, affiliate: newAffiliateData }, { redirect: false, revalidate: true });
        toast({ title: "BS Credits Details Saved!" });
        setIsBsCreditsDialogOpen(false);
    };

    const handleSavePin = (pin: string) => {
        if (!config || !affiliate) return;
        const newAffiliateData = { ...affiliate, isPinSet: true, pin: pin };
        saveConfig({ ...config, affiliate: newAffiliateData }, { redirect: false, revalidate: true });
        toast({ title: 'PIN has been set successfully!' });
        setIsPinDialogOpen(false);
    };

    const handleSaveSecurityQuestions = (data: SecurityQuestionFormData) => {
        if (!config || !affiliate) return;
        
        const questionToSave = data.question === 'custom' ? data.customQuestion : data.question;
  
        if (!questionToSave) {
            toast({ variant: 'destructive', title: 'Error', description: 'Question cannot be empty.' });
            return;
        }
  
        const newAffiliateData = {
            ...affiliate,
            securityQuestion: true, // Mark as set
            securityQuestionData: {
                question: questionToSave,
                answer: data.answer,
            },
        };
        saveConfig({ ...config, affiliate: newAffiliateData }, { redirect: false, revalidate: true });
        toast({ title: 'Security Question Saved!' });
        setIsSecurityQuestionsOpen(false);
    };

    const handleTogglePaymentMethod = (method: 'airtel' | 'tnm' | 'bank', enabled: boolean) => {
        if (!config || !affiliate) return;
    
        const newAffiliateData = { ...affiliate };
        if (!newAffiliateData.withdrawalMethods) {
            newAffiliateData.withdrawalMethods = {};
        }
    
        const methodDetails = newAffiliateData.withdrawalMethods[method];
        
        if(methodDetails) {
            methodDetails.isClientPaymentMethod = enabled;
        } else {
            toast({
                title: "Setup Required",
                description: `Please set up your ${method.toUpperCase()} details before enabling it for clients.`,
                variant: 'destructive',
            });
            return;
        }
        
        saveConfig({ ...config, affiliate: newAffiliateData }, { redirect: false, revalidate: true });
    
        toast({
            title: "Payment Method Updated",
            description: `${method.toUpperCase()} is now ${enabled ? 'enabled' : 'disabled'} for client payments.`
        });
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline">Features & Settings</h1>
            <p className="text-muted-foreground">Manage your affiliate account settings, keys, and security.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" /> My Features</CardTitle>
                        <CardDescription>Unique codes and features for your affiliate account.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold mb-2">Staff ID Code</h3>
                            <p className="text-xs text-muted-foreground mb-2">Provide this code to your staff when they are selling credits on your behalf.</p>
                            <div className="flex items-center gap-2">
                                <Input readOnly value={affiliate.staffId || 'No code generated'} className="font-mono" />
                                <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(affiliate.staffId || '')} disabled={!affiliate.staffId}>
                                    <Copy className="h-4 w-4 mr-2"/> Copy ID
                                </Button>
                                 <Button size="sm" onClick={generateNewStaffId}>
                                    Generate New
                                </Button>
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-3 pt-4">
                            <h3 className="text-sm font-semibold mb-2">Affiliate Phone Number</h3>
                            <p className="text-xs text-muted-foreground mb-2">This WhatsApp number will be used for top-up notifications and affiliate queries.</p>
                            <div className="flex items-center gap-2">
                                <Input
                                    value={affiliate.phone || ''}
                                    onChange={(e) => {
                                        if (!config || !affiliate) return;
                                        const newAffiliateData = { ...affiliate, phone: e.target.value };
                                        saveConfig({ ...config, affiliate: newAffiliateData }, { redirect: false });
                                    }}
                                    onBlur={() => toast({ title: "Phone Number Saved" })}
                                    icon={Phone}
                                    placeholder="Enter your WhatsApp number..."
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>Manage your withdrawal and security preferences.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Tabs defaultValue="withdraw" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="withdraw">Withdraw Options</TabsTrigger>
                            <TabsTrigger value="security">Security</TabsTrigger>
                            <TabsTrigger value="verification">Verification</TabsTrigger>
                        </TabsList>
                        <TabsContent value="withdraw" className="p-6">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <MethodCard 
                                    method="airtel" 
                                    name="Airtel Money" 
                                    description="Fee: K3,000" 
                                    icon={Smartphone} 
                                    isSetup={!!affiliate.withdrawalMethods?.airtel} 
                                    onAction={() => setEditingMethod('airtel')} 
                                    isPaymentMethod={affiliate.withdrawalMethods?.airtel?.isClientPaymentMethod}
                                    onTogglePaymentMethod={(enabled) => handleTogglePaymentMethod('airtel', enabled)}
                                />
                                <MethodCard 
                                    method="tnm" 
                                    name="TNM Mpamba" 
                                    description="Fee: K3,000" 
                                    icon={Smartphone} 
                                    isSetup={!!affiliate.withdrawalMethods?.tnm} 
                                    onAction={() => setEditingMethod('tnm')} 
                                    isPaymentMethod={affiliate.withdrawalMethods?.tnm?.isClientPaymentMethod}
                                    onTogglePaymentMethod={(enabled) => handleTogglePaymentMethod('tnm', enabled)}
                                />
                                <MethodCard 
                                    method="bank" 
                                    name="Bank Transfer" 
                                    description="Fee: K5,000" 
                                    icon={Banknote} 
                                    isSetup={!!affiliate.withdrawalMethods?.bank} 
                                    onAction={() => setIsBankDialogOpen(true)}
                                    isPaymentMethod={affiliate.withdrawalMethods?.bank?.isClientPaymentMethod}
                                    onTogglePaymentMethod={(enabled) => handleTogglePaymentMethod('bank', enabled)}
                                />
                                <MethodCard 
                                    method="bsCredits" 
                                    name="BS Credits" 
                                    description="No fees" 
                                    icon={Wallet} 
                                    isSetup={!!affiliate.withdrawalMethods?.bsCredits} 
                                    onAction={() => setIsBsCreditsDialogOpen(true)} 
                                />
                            </div>
                        </TabsContent>
                         <TabsContent value="security" className="p-6 space-y-4">
                           <VerificationItem
                                title="Withdrawal PIN"
                                status={affiliate.isPinSet || false}
                                actionText={affiliate.isPinSet ? 'Change PIN' : 'Set PIN'}
                                onAction={() => setIsPinDialogOpen(true)}
                            />
                            <VerificationItem
                                title="Security Questions"
                                status={!!affiliate.securityQuestionData}
                                actionText={!!affiliate.securityQuestionData ? 'Verified' : 'Set Questions'}
                                onAction={() => setIsSecurityQuestionsOpen(true)}
                                actionDisabled={!!affiliate.securityQuestionData}
                            />
                        </TabsContent>
                        <TabsContent value="verification" className="p-6">
                             <VerificationItem title="Identity Verification" status={affiliate.idUploaded} actionText="Upload ID" onAction={() => alert("Open ID upload dialog")} />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Dialogs */}
            <WithdrawalMethodDialog
                method={editingMethod!}
                isOpen={!!editingMethod}
                onClose={() => setEditingMethod(null)}
                onSave={handleSaveWithdrawalMethod}
                currentData={editingMethod ? affiliate.withdrawalMethods?.[editingMethod] : undefined}
            />
            <BankWithdrawalDialog
                isOpen={isBankDialogOpen}
                onClose={() => setIsBankDialogOpen(false)}
                onSave={handleSaveBankDetails}
                currentData={affiliate.withdrawalMethods?.bank}
            />
             <BsCreditsDialog
                isOpen={isBsCreditsDialogOpen}
                onClose={() => setIsBsCreditsDialogOpen(false)}
                onSave={handleSaveBsCredits}
                currentData={affiliate.withdrawalMethods?.bsCredits}
                staffId={affiliate.staffId}
            />
             <SetPinDialog
                isOpen={isPinDialogOpen}
                onClose={() => setIsPinDialogOpen(false)}
                onSave={handleSavePin}
                isPinSet={affiliate.isPinSet || false}
            />
            <SecurityQuestionsDialog
                isOpen={isSecurityQuestionsOpen}
                onClose={() => setIsSecurityQuestionsOpen(false)}
                onSave={handleSaveSecurityQuestions}
                currentData={affiliate.securityQuestionData}
            />
        </div>
    );
}
