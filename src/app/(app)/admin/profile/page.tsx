
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, PlusCircle, BriefcaseBusiness, Edit } from "lucide-react";
import { useBrandImage } from "@/hooks/use-brand-image";
import { useBrandsoft, type AdminSettings } from "@/hooks/use-brandsoft";
import brandsoftLogo from '@/app/brandsoftlogo.png';
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { SimpleImageUploadButton } from '@/components/simple-image-upload-button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';

const adminProfileSchema = z.object({
    fullName: z.string().min(2, "Full name is required"),
    username: z.string().min(3, "Username must be at least 3 characters"),
});

type AdminProfileFormData = z.infer<typeof adminProfileSchema>;

export default function AdminProfilePage() {
    const { config, saveConfig } = useBrandsoft();
    const { toast } = useToast();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    
    // Personal admin photo
    const { image: adminImage, isLoading: isAdminImageLoading, setImage: setAdminImage } = useBrandImage('adminProfilePic');

    const adminUser = useMemo(() => ({
        fullName: config?.admin?.fullName || 'Brandsoft Admin',
        username: config?.admin?.username || 'admin',
    }), [config?.admin]);

    const form = useForm<AdminProfileFormData>({
        resolver: zodResolver(adminProfileSchema),
        defaultValues: adminUser,
    });
    
    useEffect(() => {
        if (config?.admin) {
            form.reset({
                fullName: config.admin.fullName || 'Brandsoft Admin',
                username: config.admin.username || 'admin',
            });
        }
    }, [config?.admin, form]);

    const onSubmit = (data: AdminProfileFormData) => {
        if (!config) return;

        const newAdminSettings: AdminSettings = {
            ...(config.admin || {} as AdminSettings),
            ...data
        };
        
        saveConfig({ ...config, admin: newAdminSettings }, { redirect: false });
        
        toast({
            title: "Admin Profile Updated",
            description: "Your details have been saved.",
        });

        setIsEditDialogOpen(false);
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
                     <Avatar className="h-16 w-16">
                        {isAdminImageLoading ? (
                            <Skeleton className="h-full w-full rounded-full" />
                        ) : (
                            <>
                                <AvatarImage src={adminImage || brandsoftLogo.src} alt="Brandsoft Admin" />
                                <AvatarFallback>
                                    <BriefcaseBusiness />
                                </AvatarFallback>
                            </>
                        )}
                     </Avatar>
                    <div className="flex-1">
                        <p className="text-lg font-semibold">{adminUser.fullName}</p>
                        <p className="text-sm text-muted-foreground">@{adminUser.username}</p>
                    </div>
                     <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Edit Profile</Button>
                        </DialogTrigger>
                        <DialogContent>
                             <DialogHeader>
                                <DialogTitle>Edit Admin Profile</DialogTitle>
                                <DialogDescription>Update your admin information and profile picture.</DialogDescription>
                            </DialogHeader>
                             <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                                     <div className="flex flex-col items-center gap-4 p-4 border rounded-lg bg-muted/30">
                                        <Avatar className="h-24 w-24 border-2 border-primary/20">
                                            {isAdminImageLoading ? (
                                                <Skeleton className="h-full w-full rounded-full" />
                                            ) : (
                                                <>
                                                    <AvatarImage src={adminImage || brandsoftLogo.src} />
                                                    <AvatarFallback className="text-3xl">{form.getValues('fullName')?.charAt(0)}</AvatarFallback>
                                                </>
                                            )}
                                        </Avatar>
                                        <div className="text-center space-y-2">
                                            <SimpleImageUploadButton
                                                value={adminImage || ''}
                                                onChange={setAdminImage}
                                                buttonText="Upload Admin Photo"
                                            />
                                            {adminImage && (
                                                <Button 
                                                    type="button" 
                                                    variant="ghost" 
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive text-xs"
                                                    onClick={() => setAdminImage('')}
                                                >
                                                    Remove Photo
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="fullName" render={({ field }) => (
                                            <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <FormField control={form.control} name="username" render={({ field }) => (
                                            <FormItem><FormLabel>Username</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                    </div>
                                    
                                    <div className="flex justify-end gap-2 pt-4 border-t">
                                        <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                                        <Button type="submit">Save Changes</Button>
                                    </div>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
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
