

'use client';

import { useState, useEffect } from 'react';
import { useBrandsoft } from '@/hooks/use-brandsoft';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Copy, CheckCircle, Clock } from 'lucide-react';
import { GenerateKeyDialog } from '@/components/office/dialogs/generate-key-dialog';
import { PurchaseDialog, type PlanDetails } from '@/components/purchase-dialog';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function OfficeKeysPage() {
    const { config } = useBrandsoft();
    const { toast } = useToast();
    const router = useRouter();
    const [isGenerateKeyOpen, setIsGenerateKeyOpen] = useState(false);
    const [purchaseDetails, setPurchaseDetails] = useState<PlanDetails | null>(null);

    const affiliate = config?.affiliate;

    useEffect(() => {
        if (config && !affiliate) {
            router.push('/dashboard');
        }
    }, [config, affiliate, router]);

    if (!affiliate) {
        return <div>Loading...</div>;
    }

    const mwkBalance = affiliate.myWallet || 0;
    const generatedKeys = affiliate.generatedKeys || [];

    const handleCopyKey = (key: string) => {
        navigator.clipboard.writeText(key);
        toast({ title: "Key Copied!", description: "The activation key has been copied to your clipboard." });
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline">Activation Keys</h1>
            <p className="text-muted-foreground">Manage your generated activation keys for new clients.</p>
            
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Generated Keys</CardTitle>
                        <CardDescription>A list of all the keys you have purchased.</CardDescription>
                    </div>
                     <Button onClick={() => setIsGenerateKeyOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Activation Key
                    </Button>
                </CardHeader>
                <CardContent>
                   {generatedKeys.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Key</TableHead>
                                    <TableHead>Generated Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {generatedKeys.map((item) => {
                                    const isUsed = item.status === 'used';
                                    const maskedKey = isUsed ? `${item.key.split('-')[0]}-******` : item.key;

                                    return (
                                        <TableRow key={item.key}>
                                            <TableCell className="font-mono">{maskedKey}</TableCell>
                                            <TableCell>{new Date(item.generatedDate).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Badge variant={isUsed ? "secondary" : "success"} className="flex items-center gap-1 w-fit">
                                                    {isUsed ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                                    {isUsed ? `Used (${item.remainingDays || 0} days)` : 'Unused'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleCopyKey(item.key)}
                                                    disabled={isUsed}
                                                >
                                                    <Copy className={cn("h-4 w-4", !isUsed && "mr-2")}/>
                                                    {!isUsed && 'Copy'}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                   ) : (
                     <div className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed">
                        <p className="text-muted-foreground">You have not generated any keys yet.</p>
                    </div>
                   )}
                </CardContent>
            </Card>

            <GenerateKeyDialog
                isOpen={isGenerateKeyOpen}
                onClose={() => setIsGenerateKeyOpen(false)}
                staffId={affiliate.staffId || ''}
                walletBalance={mwkBalance}
                creditBalance={affiliate.creditBalance || 0}
            />
            {purchaseDetails && (
                <PurchaseDialog
                    plan={purchaseDetails}
                    isOpen={!!purchaseDetails}
                    onClose={() => setPurchaseDetails(null)}
                    onSuccess={() => { setPurchaseDetails(null); setIsGenerateKeyOpen(false); }}
                    isTopUp
                />
            )}
        </div>
    );
}
