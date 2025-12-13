
'use client';

import { useState, useMemo, useRef, ChangeEvent, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useBrandsoft, type Company, type Review } from '@/hooks/use-brandsoft';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PlusCircle, Trash2, UploadCloud, Download, Search, Building, MapPin, Globe, Phone, Mail, Star } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import { CompanyCard } from '@/components/company-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';

const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Contact person's name is required"),
  companyName: z.string().min(2, "Company name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  address: z.string().optional(),
  town: z.string().optional(),
  industry: z.string().optional(),
  description: z.string().optional(),
  logo: z.string().optional(),
  coverImage: z.string().optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal('')),
});

type CompanyFormData = z.infer<typeof formSchema>;

const ITEMS_PER_PAGE = 20;
const fallBackCover = 'https://picsum.photos/seed/shopcover/1200/400';

const ImageUploadField = ({
  form,
  name,
  label,
  currentValue,
}: {
  form: any;
  name: keyof CompanyFormData;
  label: string;
  currentValue?: string;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | undefined>(currentValue);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setPreview(dataUrl);
        form.setValue(name, dataUrl, { shouldDirty: true });
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Update preview if currentValue changes from form reset
  useEffect(() => {
    setPreview(currentValue);
  }, [currentValue]);

  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <div className="flex items-center gap-4">
        {preview && (
          <img src={preview} alt={`${label} preview`} className="h-16 w-16 rounded-md object-cover border" />
        )}
        <div className="flex-grow">
          <Input
            type="file"
            accept="image/*"
            ref={inputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} className="w-full">
            <UploadCloud className="mr-2 h-4 w-4" />
            {preview ? 'Change Image' : 'Upload Image'}
          </Button>
        </div>
      </div>
      <FormMessage />
    </FormItem>
  );
};

export default function CompaniesPage() {
  const { config, addCompany, updateCompany, deleteCompany } = useBrandsoft();
  const { toast } = useToast();
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      companyName: '',
      email: '',
    },
  });

   const companiesWithRatings = useMemo(() => {
    if (!config || !config.companies) return [];

    return config.companies.map(biz => {
      const companyReviews = config.reviews?.filter((r: Review) => r.businessId === biz.id) || [];
      const reviewCount = companyReviews.length;
      const averageRating = reviewCount > 0
        ? companyReviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount
        : 0;
      
      return { ...biz, averageRating, reviewCount };
    });
  }, [config]);


  const filteredCompanies = useMemo(() => {
    let companies = companiesWithRatings;
    
    if (searchTerm) {
      companies = companies.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.companyName && c.companyName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    return companies;
  }, [companiesWithRatings, searchTerm]);

  const paginatedCompanies = useMemo(() => {
    const startIndex = currentPage * ITEMS_PER_PAGE;
    return filteredCompanies.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredCompanies, currentPage]);

  const totalPages = Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE);

  const handleOpenForm = (company: Company | null = null) => {
    setSelectedCompany(company);
    if (company) {
      form.reset(company);
    } else {
      form.reset({
        id: undefined, name: '', companyName: '', email: '', phone: '',
        address: '', town: '', industry: '', description: '', logo: '', coverImage: '', website: ''
      });
    }
    setIsFormOpen(true);
  };
  
  const handleSelectAction = (action: 'view' | 'edit' | 'delete', company: Company) => {
      setSelectedCompany(company);
      if (action === 'edit') handleOpenForm(company);
      if (action === 'delete') setIsDeleteOpen(true);
      if (action === 'view') setIsViewOpen(true);
  };

  const onSubmit = (data: CompanyFormData) => {
    const companyToSave: Partial<Company> = {
        ...data,
        customerType: 'company',
    };
    
    if (data.id) {
        updateCompany(data.id, companyToSave);
    } else {
        addCompany(companyToSave as Omit<Company, 'id'>);
    }
    
    setIsFormOpen(false);
  };
  
  const handleDelete = () => {
    if (selectedCompany) {
        deleteCompany(selectedCompany.id);
        setIsDeleteOpen(false);
        setSelectedCompany(null);
    }
  };

  const handleExportAll = () => {
    // Implementation for exporting all companies
  };
  
  const currentViewedCompany = companiesWithRatings.find(c => c.id === selectedCompany?.id);


  return (
    <div className="container mx-auto space-y-6 max-w-[100vw] overflow-hidden">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Companies</h1>
          <p className="text-muted-foreground">Manage your B2B contacts and marketplace peers.</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportAll}><Download className="mr-2 h-4 w-4" /> Export All</Button>
            <Button onClick={() => handleOpenForm()}><PlusCircle className="mr-2 h-4 w-4" /> Add New Company</Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search companies..." className="pl-10" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(0); }}/>
        </div>
        
        {paginatedCompanies.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {paginatedCompanies.map((company) => (
                    <CompanyCard 
                        key={company.id} 
                        company={company} 
                        averageRating={company.averageRating}
                        reviewCount={company.reviewCount}
                        onSelectAction={(action) => handleSelectAction(action as 'view' | 'edit' | 'delete', company)} 
                        showActionsMenu={true}
                    />
                ))}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center text-center h-64 rounded-lg border-2 border-dashed">
                <p className="text-lg font-medium text-muted-foreground">No companies found.</p>
                <p className="text-sm text-muted-foreground">Try adjusting your search or add a new company.</p>
            </div>
        )}

         {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
                 <span className="text-sm text-muted-foreground">Page {currentPage + 1} of {totalPages}</span>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 0}>Previous</Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages - 1}>Next</Button>
                </div>
            </div>
        )}
      </div>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>{selectedCompany ? 'Edit' : 'Add New'} Company Profile</DialogTitle>
                <DialogDescription>This information will appear on the marketplace and documents.</DialogDescription>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto pr-6 -mr-6">
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                    
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground">Company Information</h3>
                        <FormField control={form.control} name="companyName" render={({ field }) => ( <FormItem><FormLabel>Company Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="industry" render={({ field }) => ( <FormItem><FormLabel>Industry</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                            <FormField control={form.control} name="website" render={({ field }) => ( <FormItem><FormLabel>Website</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        </div>
                    </div>

                    <Separator />
                    
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-muted-foreground">Visuals</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <ImageUploadField form={form} name="logo" label="Company Logo" currentValue={form.getValues('logo')} />
                         <ImageUploadField form={form} name="coverImage" label="Cover Image" currentValue={form.getValues('coverImage')} />
                      </div>
                    </div>

                    <Separator />

                     <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground">Contact Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Contact Person</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                            <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Contact Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        </div>
                         <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                    </div>

                    <Separator />
                    
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground">Location</h3>
                        <FormField control={form.control} name="address" render={({ field }) => ( <FormItem><FormLabel>Address</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )}/>
                        <FormField control={form.control} name="town" render={({ field }) => ( <FormItem><FormLabel>Town</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                    </div>


                    <DialogFooter className="pt-4 sticky bottom-0 bg-background pb-0 -mb-6">
                        <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                        <Button type="submit">Save Company</Button>
                    </DialogFooter>
                </form>
                </Form>
            </div>
          </DialogContent>
      </Dialog>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl p-0">
          {currentViewedCompany && (
            <div className="flex flex-col">
              <div className="relative h-40">
                <Image src={currentViewedCompany.coverImage || fallBackCover} alt={`${currentViewedCompany.companyName} cover`} layout="fill" objectFit="cover" className="rounded-t-lg" data-ai-hint="office workspace" />
                 <div className="absolute inset-0 bg-black/50" />
              </div>
              <div className="relative p-6 flex flex-col items-center -mt-16">
                 <Avatar className="h-28 w-28 border-4 border-background bg-background">
                  <AvatarImage src={currentViewedCompany.logo} />
                  <AvatarFallback><Building className="h-12 w-12" /></AvatarFallback>
                </Avatar>
                <DialogHeader className="text-center mt-4">
                  <DialogTitle className="text-2xl font-headline">{currentViewedCompany.companyName}</DialogTitle>
                  <DialogDescription>{currentViewedCompany.industry}</DialogDescription>
                </DialogHeader>
                 <div className="mt-2 flex justify-center items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                        <Star
                            key={i}
                            className={`h-5 w-5 ${i < Math.round(currentViewedCompany.averageRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
                        />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">({currentViewedCompany.reviewCount} reviews)</span>
                </div>
                 <p className="mt-4 text-sm text-center text-muted-foreground">{currentViewedCompany.description}</p>
                 <Separator className="my-6" />
                 <div className="w-full space-y-3 text-sm">
                    {currentViewedCompany.email && <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-muted-foreground" /> <span>{currentViewedCompany.email}</span></div>}
                    {currentViewedCompany.phone && <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-muted-foreground" /> <span>{currentViewedCompany.phone}</span></div>}
                    {currentViewedCompany.website && <div className="flex items-center gap-3"><Globe className="h-4 w-4 text-muted-foreground" /> <a href={currentViewedCompany.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">{currentViewedCompany.website}</a></div>}
                    {currentViewedCompany.address && <div className="flex items-start gap-3"><MapPin className="h-4 w-4 text-muted-foreground mt-1" /> <span>{currentViewedCompany.address}</span></div>}
                 </div>
              </div>
              <DialogFooter className="p-4 border-t bg-muted rounded-b-lg">
                <Button onClick={() => setIsViewOpen(false)}>Close</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>This action cannot be undone. This will permanently delete the company "{selectedCompany?.companyName}".</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
