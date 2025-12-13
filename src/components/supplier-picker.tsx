
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useBrandsoft, type Company } from '@/hooks/use-brandsoft';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Building, MapPin } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Checkbox } from './ui/checkbox';
import { Button } from './ui/button';
import { DialogFooter } from './ui/dialog';

interface SupplierPickerProps {
    allBusinesses: Company[];
    initialSelection: string[];
    onSelectionChange: (selectedIds: string[]) => void;
}

export function SupplierPicker({ allBusinesses, initialSelection, onSelectionChange }: SupplierPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [townFilter, setTownFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelection);

  useEffect(() => {
    setSelectedIds(initialSelection);
  }, [initialSelection]);

  const filteredBusinesses = useMemo(() => {
    return allBusinesses.filter(biz => {
      const nameMatch = biz.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
      const industryMatch = industryFilter === 'all' || biz.industry === industryFilter;
      const townMatch = townFilter === 'all' || biz.town === townFilter;
      return nameMatch && industryMatch && townMatch;
    });
  }, [allBusinesses, searchTerm, industryFilter, townFilter]);

  const industries = useMemo(() => [...new Set(allBusinesses.map(b => b.industry).filter(Boolean))], [allBusinesses]);
  const towns = useMemo(() => [...new Set(allBusinesses.map(b => b.town).filter(Boolean))], [allBusinesses]);

  const handleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  return (
    <>
        <div className="p-4 border-b flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                placeholder="Search by company name..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex gap-4">
                <Select value={industryFilter} onValueChange={setIndustryFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by industry" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Industries</SelectItem>
                    {industries.map(ind => <SelectItem key={ind} value={ind}>{ind}</SelectItem>)}
                </SelectContent>
                </Select>
                <Select value={townFilter} onValueChange={setTownFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by town" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Towns</SelectItem>
                    {towns.map(town => <SelectItem key={town} value={town}>{town}</SelectItem>)}
                </SelectContent>
                </Select>
            </div>
        </div>
        <ScrollArea className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {filteredBusinesses.map(biz => (
                    <Card
                        key={biz.id}
                        className="flex flex-row items-center p-3 gap-3 cursor-pointer transition-all hover:shadow-md"
                        onClick={() => handleSelect(biz.id)}
                    >
                       <Avatar className="h-12 w-12">
                           <AvatarImage src={biz.logo} />
                           <AvatarFallback><Building/></AvatarFallback>
                       </Avatar>
                        <div className="flex-grow">
                           <p className="font-semibold text-sm truncate">{biz.companyName}</p>
                           <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Building className="h-3 w-3" />
                                <span>{biz.industry || 'Not specified'}</span>
                            </div>
                             <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span>{biz.town || 'Not specified'}</span>
                            </div>
                       </div>
                        <Checkbox
                            checked={selectedIds.includes(biz.id)}
                            className="h-5 w-5 ml-auto flex-shrink-0"
                        />
                    </Card>
                ))}
            </div>
            {filteredBusinesses.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                    <p>No businesses found matching your criteria.</p>
                </div>
            )}
        </ScrollArea>
        <DialogFooter className="p-4 border-t">
            <Button onClick={() => onSelectionChange(selectedIds)}>Done ({selectedIds.length} selected)</Button>
        </DialogFooter>
    </>
  );
}
