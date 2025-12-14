
"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type ComboboxProps = {
    options: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
    onCreate?: (value: string) => void;
    placeholder?: string;
    createText?: (value: string) => string;
    notFoundText?: string;
}

export function Combobox({ 
    options, 
    value, 
    onChange, 
    onCreate, 
    placeholder = "Select an option...", 
    createText = (value) => `Create "${value}"`, 
    notFoundText = "No results found." 
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

  const handleSelect = (currentValue: string) => {
    const lowercasedValue = currentValue.toLowerCase();
    // Check if the selected value is different from the current value before calling onChange
    if (lowercasedValue !== value.toLowerCase()) {
      onChange(currentValue);
    } else {
      onChange(''); // Allow unselecting
    }
    setOpen(false);
  };
  
  const handleCreate = () => {
    if(onCreate && inputValue) {
        onCreate(inputValue);
        setOpen(false);
    }
  }
  
  const displayedValue = options.find((option) => option.value.toLowerCase() === value.toLowerCase())?.label || value || placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">{displayedValue}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={true}>
          <CommandInput 
            placeholder={placeholder}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty>
                {onCreate ? (
                     <Button variant="ghost" className="w-full" onMouseDown={(e) => {
                        e.preventDefault();
                        handleCreate();
                     }}>
                        {createText(inputValue)}
                     </Button>
                ) : (
                    notFoundText
                )}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label} // Compare against label for filtering
                  onSelect={() => {
                    handleSelect(option.label)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value.toLowerCase() === option.label.toLowerCase() ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
