import * as React from "react";
import { cn } from "@/lib/utils";

export interface LoginInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const LoginInput = React.forwardRef<HTMLInputElement, LoginInputProps>(
  ({ className, type, label, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-gold-light">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "flex h-12 w-full rounded-md border border-border bg-secondary px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all duration-200",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
LoginInput.displayName = "LoginInput";

export { LoginInput };
