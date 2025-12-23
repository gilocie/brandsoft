'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, PlusCircle, BriefcaseBusiness, Edit, Eye, EyeOff, Lock, Shield } from "lucide-react";
import { useBrandImage } from "@/hooks/use-brand-image";
import { useBrandsoft, type AdminSettings } from "@/hooks/use-brandsoft";
import brandsoftLogo from '@/app/brandsoftlogo.png';
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { SimpleImageUploadButton } from '@/components/simple-image-upload-button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';

// Updated schema with password fields
const adminProfileSchema = z.object({
    fullName: z.string().min(2, "Full name is required"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    currentPassword: z.string().optional(),
    newPassword: z.string().optional().refine(val => !val || val.length >= 6, {
        message: "Password must be at least 6 characters.",
    }),
    confirmPassword: z.string().optional(),
}).refine(data => !data.newPassword || data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
}).refine(data => !data.newPassword || data.currentPassword, {
    message: "Current password is required to set a new password.",
    path: ["currentPassword"],
});

type AdminProfileFormData = z.infer<typeof adminProfileSchema>;

export default function AdminProfilePage() {
    const { config, saveConfig } = useBrandsoft();
    const { toast } = useToast();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [dialogTab, setDialogTab] = useState('profile');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    
    // Personal admin photo
    const { image: adminImage, isLoading: isAdminImageLoading, setImage: setAdminImage } = useBrandImage('adminProfilePic');

    const adminUser = useMemo(() => ({
        fullName: config?.admin?.fullName || 'Brandsoft Admin',
        username: config?.admin?.username || 'admin',
    }), [config?.admin]);

    const form = useForm<AdminProfileFormData>({
        resolver: zodResolver(adminProfileSchema),
        defaultValues: {
            ...adminUser,
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
    });
    
    // Reset form when dialog opens
    useEffect(() => {
        if (isEditDialogOpen && config?.admin) {
            form.reset({
                fullName: config.admin.fullName || 'Brandsoft Admin',
                username: config.admin.username || 'admin',
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
            setDialogTab('profile');
            setShowCurrentPassword(false);
            setShowNewPassword(false);
        }
    }, [config?.admin, form, isEditDialogOpen]);

    const onSubmit = (data: AdminProfileFormData) => {
        if (!config) return;

        // Validate current password if trying to change password
        if (data.newPassword) {
            const storedPassword = config.admin?.password || 'password'; // Default password
            if (data.currentPassword !== storedPassword) {
                form.setError('currentPassword', { 
                    type: 'manual', 
                    message: 'Current password is incorrect.' 
                });
                return;
            }
        }

        const newAdminSettings: AdminSettings = {
            ...(config.admin || {} as AdminSettings),
            fullName: data.fullName,
            username: data.username,
            // Only update password if new password is provided
            ...(data.newPassword && { password: data.newPassword }),
        };
        
        saveConfig({ ...config, admin: newAdminSettings }, { redirect: false });
        
        toast({
            title: "Admin Profile Updated",
            description: data.newPassword 
                ? "Your profile and password have been updated successfully."
                : "Your details have been saved.",
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
                        <DialogContent className="sm:max-w-2xl">
                             <DialogHeader>
                                <DialogTitle>Edit Admin Profile</DialogTitle>
                                <DialogDescription>Update your admin information and security settings.</DialogDescription>
                            </DialogHeader>
                             <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2">
                                    {/* TABS INSIDE DIALOG */}
                                    <Tabs value={dialogTab} onValueChange={setDialogTab} className="w-full">
                                        <TabsList className="grid w-full grid-cols-2">
                                            <TabsTrigger value="profile" className="gap-2">
                                                <User className="h-4 w-4" /> Profile
                                            </TabsTrigger>
                                            <TabsTrigger value="security" className="gap-2">
                                                <Shield className="h-4 w-4" /> Security
                                            </TabsTrigger>
                                        </TabsList>
                                        
                                        {/* PROFILE TAB */}
                                        <TabsContent value="profile" className="pt-6">
                                            <div className="flex flex-col md:flex-row gap-6">
                                                {/* LEFT: Avatar Upload */}
                                                <div className="flex flex-col items-center gap-4 p-4 border rounded-lg bg-muted/30 md:w-[180px] flex-shrink-0">
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
                                                            buttonText="Upload Photo"
                                                        />
                                                        {adminImage && (
                                                            <Button 
                                                                type="button" 
                                                                variant="ghost" 
                                                                size="sm"
                                                                className="text-destructive hover:text-destructive text-xs"
                                                                onClick={() => setAdminImage('')}
                                                            >
                                                                Remove
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {/* RIGHT: Profile Fields */}
                                                <div className="flex-1 space-y-4">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <FormField 
                                                            control={form.control} 
                                                            name="fullName" 
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Full Name</FormLabel>
                                                                    <FormControl>
                                                                        <Input placeholder="John Doe" {...field} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )} 
                                                        />
                                                        <FormField 
                                                            control={form.control} 
                                                            name="username" 
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Username</FormLabel>
                                                                    <FormControl>
                                                                        <Input placeholder="admin" {...field} />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )} 
                                                        />
                                                    </div>
                                                    
                                                    {/* Admin Role Display */}
                                                    <div className="pt-2 space-y-2 text-sm">
                                                        <div className="flex justify-between text-muted-foreground">
                                                            <span>Role:</span>
                                                            <span className="font-medium text-foreground">System Administrator</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </TabsContent>
                                        
                                        {/* SECURITY TAB */}
                                        <TabsContent value="security" className="pt-6">
                                            <div className="space-y-6">
                                                {/* Header */}
                                                <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                                        <Lock className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium">Change Admin Password</h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            Update your password to keep your admin account secure.
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                {/* Password Fields */}
                                                <div className="space-y-4">
                                                    <FormField 
                                                        control={form.control} 
                                                        name="currentPassword" 
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Current Password</FormLabel>
                                                                <div className="relative">
                                                                    <FormControl>
                                                                        <Input 
                                                                            type={showCurrentPassword ? 'text' : 'password'} 
                                                                            placeholder="Enter current password" 
                                                                            {...field} 
                                                                        />
                                                                    </FormControl>
                                                                    <Button 
                                                                        type="button" 
                                                                        variant="ghost" 
                                                                        size="icon" 
                                                                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" 
                                                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                                    >
                                                                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                                    </Button>
                                                                </div>
                                                                <FormDescription>
                                                                    Required to change your password. Default is "password" if never changed.
                                                                </FormDescription>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} 
                                                    />
                                                    
                                                    <Separator />
                                                    
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <FormField 
                                                            control={form.control} 
                                                            name="newPassword" 
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>New Password</FormLabel>
                                                                    <div className="relative">
                                                                        <FormControl>
                                                                            <Input 
                                                                                type={showNewPassword ? 'text' : 'password'} 
                                                                                placeholder="Enter new password" 
                                                                                {...field} 
                                                                            />
                                                                        </FormControl>
                                                                        <Button 
                                                                            type="button" 
                                                                            variant="ghost" 
                                                                            size="icon" 
                                                                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" 
                                                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                                                        >
                                                                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                                        </Button>
                                                                    </div>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )} 
                                                        />
                                                        <FormField 
                                                            control={form.control} 
                                                            name="confirmPassword" 
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Confirm New Password</FormLabel>
                                                                    <FormControl>
                                                                        <Input 
                                                                            type={showNewPassword ? 'text' : 'password'} 
                                                                            placeholder="Confirm new password" 
                                                                            {...field} 
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )} 
                                                        />
                                                    </div>
                                                    
                                                    <p className="text-xs text-muted-foreground">
                                                        Password must be at least 6 characters. Leave blank to keep your current password.
                                                    </p>
                                                </div>
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                    
                                    {/* Footer Buttons */}
                                    <div className="flex justify-end gap-2 pt-4 border-t">
                                        <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit">
                                            Save Changes
                                        </Button>
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