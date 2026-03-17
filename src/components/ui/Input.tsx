import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-ink-600 mb-1.5">{label}</label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">{icon}</div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full bg-white border border-ink-200 rounded-lg py-2.5 px-3 text-sm text-ink-800",
              "placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-ink-300 focus:border-transparent",
              "transition-all",
              icon && "pl-9",
              error && "border-coral-400 focus:ring-coral-300",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-coral-500 text-xs mt-1">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
export default Input;
