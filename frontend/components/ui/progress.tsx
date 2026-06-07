import * as React from "react";

import { cn } from "@/lib/utils";

type ProgressProps = React.HTMLAttributes<HTMLDivElement> & {
  value: number;
};

export function Progress({ className, value, ...props }: ProgressProps) {
  return (
    <div
      className={cn("h-2 overflow-hidden rounded-full bg-[#d9dde3]", className)}
      {...props}
    >
      <div
        className="h-full rounded-full bg-[#99FF33] transition-all"
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );
}
