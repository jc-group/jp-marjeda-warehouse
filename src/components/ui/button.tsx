import * as React from "react";

import { cn } from "@/lib/utils";

const baseStyles =
  "inline-flex items-center justify-center whitespace-nowrap rounded-md font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-background";

const sizeStyles: Record<"sm" | "lg", string> = {
  sm: "h-10 px-4 text-sm",
  lg: "h-14 px-6 text-base",
};

const variantStyles: Record<"default" | "secondary" | "ghost", string> = {
  default: "bg-black text-white hover:bg-zinc-800",
  secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
  ghost: "hover:bg-zinc-100",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "ghost";
  size?: "sm" | "lg";
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "lg", asChild = false, children, ...props }, ref) => {
    const mergedClassName = cn(baseStyles, sizeStyles[size], variantStyles[variant], className);

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        className: cn((children as { props?: { className?: string } }).props?.className, mergedClassName),
        ...props,
      });
    }

    return (
      <button className={mergedClassName} ref={ref} {...props}>
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
