
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NewTemplatePage() {
  return (
    <div className="container mx-auto space-y-6">
       <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline">Template Designer</h1>
            <p className="text-muted-foreground">Create a new template for your documents.</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/templates">Cancel</Link>
          </Button>
       </div>
       <div className="flex h-[60vh] items-center justify-center rounded-lg border-2 border-dashed bg-muted/40">
        <div className="text-center">
            <h2 className="text-2xl font-semibold font-headline">Design Canvas</h2>
            <p className="text-muted-foreground">This is where the template design canvas will be.</p>
        </div>
       </div>
    </div>
  );
}
