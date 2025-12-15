
'use client';

import React, { useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UploadCloud } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const SimpleImageUploadButton = ({
  value,
  onChange,
  buttonText = "Upload Image",
  iconOnly = false,
}: {
  value?: string;
  onChange: (value: string) => void;
  buttonText?: string;
  iconOnly?: boolean;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        onChange(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const buttonContent = iconOnly ? (
    <Button 
        type="button" 
        variant="outline" 
        size="icon"
        onClick={() => inputRef.current?.click()}
        className="rounded-full h-9 w-9"
      >
        <UploadCloud className="h-4 w-4" />
      </Button>
  ) : (
     <Button 
        type="button" 
        variant="outline" 
        onClick={() => inputRef.current?.click()}
        className="w-full"
      >
        <UploadCloud className="mr-2 h-4 w-4" />
        {buttonText}
      </Button>
  );

  return (
    <>
      <Input
        type="file"
        accept="image/*"
        ref={inputRef}
        onChange={handleFileChange}
        className="hidden"
      />
       {iconOnly ? (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
                <TooltipContent><p>{buttonText}</p></TooltipContent>
            </Tooltip>
        </TooltipProvider>
      ) : (
        buttonContent
      )}
    </>
  );
};
