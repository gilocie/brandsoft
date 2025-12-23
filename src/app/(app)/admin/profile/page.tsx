
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, PlusCircle } from "lucide-react";

export default function AdminProfilePage() {
    // In a real app, you'd fetch admin details from your config/state
    const adminUser = {
        fullName: 'Brandsoft Admin',
        username: 'admin'
    };

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
                     <div className="p-3 bg-muted rounded-full">
                        <User className="h-8 w-8 text-muted-foreground" />
                    </div>
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
