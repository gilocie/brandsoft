
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { PlusCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const templateCategories = [
  {
    value: 'invoice',
    label: 'Invoices',
    description: 'Browse and manage your invoice templates.',
  },
  {
    value: 'quotation',
    label: 'Quotations',
    description: 'Browse and manage your quotation templates.',
  },
  {
    value: 'certificate',
    label: 'Certificates',
    description: 'Browse and manage your certificate templates.',
  },
  {
    value: 'id-card',
    label: 'ID Cards',
    description: 'Browse and manage your ID card templates.',
  },
  {
    value: 'marketing',
    label: 'Marketing',
    description: 'Browse and manage your marketing material templates.',
  },
];

export default function TemplatesPage() {
  return (
    <div className="container mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Template Marketplace</h1>
          <p className="text-muted-foreground">
            Browse, download, and manage your document templates.
          </p>
        </div>
        <Button asChild>
          <Link href="/templates/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Template
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="invoice" className="space-y-4">
        <TabsList>
          {templateCategories.map((cat) => (
            <TabsTrigger key={cat.value} value={cat.value}>
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {templateCategories.map((cat) => (
          <TabsContent key={cat.value} value={cat.value}>
            <Card>
              <CardHeader>
                <CardTitle>{cat.label} Templates</CardTitle>
                <CardDescription>{cat.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-60 flex-col items-center justify-center rounded-lg border-2 border-dashed">
                  <p className="mb-4 text-muted-foreground">No {cat.label.toLowerCase()} templates yet.</p>
                  <Button asChild>
                    <Link href="/templates/new">
                      <PlusCircle className="mr-2 h-4 w-4" /> Design Template
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
