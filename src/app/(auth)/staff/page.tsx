
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
        // Wait until the config loading status is determined.
        if (isConfigured === null) {
            return;
        }

        // Once the configuration is confirmed to be loaded (or not)
        if (isConfigured) {
            // If config exists, check for an affiliate
            if (config?.affiliate) {
                // If an affiliate exists, they must log in
                router.replace('/staff/login');
            } else {
                // If no affiliate, they must register
                router.replace('/staff/register');
            }
        } else {
             // If the app is not configured at all, there's nowhere for a staff member to go.
             // Redirecting to the root will start the activation/setup flow.
             router.replace('/');
        }
        
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
