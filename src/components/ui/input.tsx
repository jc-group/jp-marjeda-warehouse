import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, value, defaultValue, ...props }, ref) => {
    const inputProps: React.InputHTMLAttributes<HTMLInputElement> = { ...props };
    if (value !== undefined) {
      inputProps.value = value;
    } else if (defaultValue !== undefined) {
      inputProps.defaultValue = defaultValue;
    }

    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...inputProps}
      />
    );
  }
);
Input.displayName = "Input";
