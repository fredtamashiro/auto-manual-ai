import * as React from "react";

import { cn } from "@/lib/utils";

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-lg border border-[#d9dde3] bg-white px-3 py-2 text-sm text-[#1A1A1A] outline-none transition focus:border-[#99FF33] disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}
