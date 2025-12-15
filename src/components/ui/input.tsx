import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ElementType;
  prefix?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, value, icon: Icon, prefix, ...props }, ref) => {
    const hasIcon = Icon != null;
    const hasPrefix = prefix != null;
    return (
      <div className="relative">
        {hasIcon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
        {hasPrefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base md:text-sm text-muted-foreground">{prefix}</span>}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            hasIcon ? "pl-10 pr-3" : "px-3",
            hasPrefix && !hasIcon && "pl-7", // Add padding for prefix if no icon
            className
          )}
          ref={ref}
          value={value ?? ""}
          {...props}
        />
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
