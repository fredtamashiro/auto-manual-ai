import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#99FF33]",
  {
    variants: {
      variant: {
        default: "bg-[#99FF33] text-[#1A1A1A] hover:brightness-95",
        destructive:
          "border border-red-200 bg-white text-red-700 hover:bg-red-50",
        outline:
          "border border-[#d9dde3] bg-white text-[#1A1A1A] hover:bg-[#F0F2F5]",
        ghost: "text-[#666666] hover:bg-[#F0F2F5]",
      },
      size: {
        default: "h-12 px-5 py-2.5",
        sm: "h-10 px-4 text-xs",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({
  className,
  variant,
  size,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
