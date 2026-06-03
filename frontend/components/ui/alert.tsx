import * as React from "react";

import { cn } from "@/lib/utils";

export function Alert({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm text-slate-300",
        className,
      )}
      {...props}
    />
  );
}
