import { BriefcaseBusiness } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <BriefcaseBusiness className="h-8 w-8 text-primary" />
      <h1 className="text-3xl font-headline font-bold text-primary">BrandSoft</h1>
    </div>
  );
}
