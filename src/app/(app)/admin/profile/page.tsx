
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, PlusCircle, BriefcaseBusiness } from "lucide-react";
import { useBrandImage } from "@/hooks/use-brand-image";
import brandsoftLogo from '@/app/brandsoftlogo.png';
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminProfilePage() {
    // In a real app, you'd fetch admin details from your config/state
    const adminUser = {
        fullName: 'Brandsoft Admin',
        username: 'admin'
    };

    const { image: logoImage, isLoading: isLogoLoading } = useBrandImage('logo');

    return (
        <div className="container mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">Admin Profile</h1>
                <p className="text-muted-foreground">Manage administrator accounts.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Current Administrator</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-4">
                     <Avatar className="h-16 w-16">
                        {isLogoLoading ? (
                            <Skeleton className="h-full w-full rounded-full" />
                        ) : (
                            <>
                                <AvatarImage src={logoImage || brandsoftLogo.src} alt="Brandsoft Admin" />
                                <AvatarFallback>
                                    <BriefcaseBusiness />
                                </AvatarFallback>
                            </>
                        )}
                     </Avatar>
                    <div>
                        <p className="text-lg font-semibold">{adminUser.fullName}</p>
                        <p className="text-sm text-muted-foreground">@{adminUser.username}</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Manage Admins</CardTitle>
                    <CardDescription>Add or remove administrator accounts.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add New Admin
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
