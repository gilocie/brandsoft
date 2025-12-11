
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const PlanCard = ({ title, price, features, isCurrent = false, cta, className }: { title: string, price: string, features: string[], isCurrent?: boolean, cta: string, className?: string }) => (
    <Card className={cn("flex flex-col h-full", isCurrent && "ring-2 ring-primary shadow-md", className)}>
        <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription className="text-4xl font-bold">{price}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow space-y-2">
            {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                </div>
            ))}
        </CardContent>
        <div className="p-6 pt-0">
             <Button 
                className="w-full" 
                variant={isCurrent ? "secondary" : "default"}
                disabled={isCurrent}
             >
                {isCurrent ? 'Current Plan' : cta}
            </Button>
        </div>
    </Card>
);

export function ManagePlanDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="secondary" size="sm" className="mt-4">
                    Manage
                </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-6xl w-[95vw] max-h-[80vh] flex flex-col p-4 sm:p-6">
                <DialogHeader className="flex-shrink-0 mb-2">
                    <DialogTitle className="text-3xl font-headline">Manage Your Plan</DialogTitle>
                    <DialogDescription>
                        Choose the plan that best fits your business needs.
                    </DialogDescription>
                </DialogHeader>
                
                {/* Scrollable Area */}
                <div className="flex-1 overflow-y-auto min-h-0 py-2 px-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        
                        {/* Free Trial */}
                        <div>
                            <PlanCard 
                                title="Free Trial" 
                                price="$0"
                                features={["Up to 10 invoices", "Up to 10 customers", "Basic templates"]}
                                isCurrent={true}
                                cta="Select Plan"
                            />
                        </div>

                        {/* Standard */}
                        <div>
                            <PlanCard 
                                title="Standard" 
                                price="$29"
                                features={["Unlimited invoices", "Unlimited customers", "Premium templates", "Email support"]}
                                cta="Upgrade"
                            />
                        </div>

                        {/* Pro */}
                        <div>
                             <PlanCard 
                                title="Pro" 
                                price="$79"
                                features={["All Standard features", "API access", "Priority support", "Advanced analytics"]}
                                cta="Upgrade"
                            />
                        </div>

                        {/* Enterprise */}
                        <div>
                             <PlanCard 
                                title="Enterprise" 
                                price="Custom"
                                features={["All Pro features", "Dedicated support", "Custom integrations", "On-premise option"]}
                                cta="Contact Us"
                            />
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
