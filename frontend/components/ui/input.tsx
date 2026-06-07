import * as React from "react";

import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "block w-full rounded-lg border border-[#d9dde3] bg-white px-3 py-2 text-sm text-[#1A1A1A] outline-none transition file:mr-4 file:border-0 file:bg-[#99FF33] file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-[#1A1A1A] hover:file:brightness-95 focus:border-[#99FF33] disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}
