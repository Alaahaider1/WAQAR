"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-body text-sm font-medium tracking-widest uppercase transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:pointer-events-none disabled:opacity-40 select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-charcoal text-ivory hover:bg-stone border border-charcoal hover:border-stone",
        outline:
          "bg-transparent text-charcoal border border-charcoal hover:bg-charcoal hover:text-ivory",
        gold:
          "bg-gold text-ivory border border-gold hover:bg-gold-light hover:border-gold-light",
        "gold-outline":
          "bg-transparent text-gold border border-gold hover:bg-gold hover:text-ivory",
        ghost:
          "bg-transparent text-charcoal hover:bg-linen border border-transparent",
        link:
          "bg-transparent text-charcoal underline-offset-4 hover:underline border-none p-0 h-auto tracking-normal uppercase-none font-normal",
      },
      size: {
        sm: "h-9 px-5 text-xs",
        md: "h-11 px-8 text-xs",
        lg: "h-13 px-10 text-xs",
        xl: "h-14 px-12 text-xs",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
