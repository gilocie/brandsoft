
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBrandsoft } from '@/hooks/use-brandsoft';
import { Loader2 } from 'lucide-react';
import brandsoftBackground from '@/app/backgrounds/background.jpg';

export default function StaffPage() {
    const { config, isConfigured } = useBrandsoft();
    const router = useRouter();

    useEffect(() => {
        if (isConfigured === null) {
            // Still loading config
            return;
        }

        if (config?.affiliate) {
            // If an affiliate exists, they must log in
            router.replace('/staff/login');
        } else if (isConfigured === true && !config?.affiliate) {
            // If configured but no affiliate, they must register
            router.replace('/staff/register');
        }
        // If not configured, wait for config to be set up.
        // A user shouldn't land here without config, but this is a safeguard.
        
    }, [config, isConfigured, router]);

    return (
        <div
            className="flex h-screen w-full items-center justify-center bg-background bg-cover bg-center"
            style={{ backgroundImage: `url(${brandsoftBackground.src})` }}
        >
            <div className="absolute inset-0 bg-black/80" />
            <div className="relative flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Redirecting...</p>
            </div>
        </div>
    );
}
