import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LoadingButtonProps extends ButtonProps {
    isLoading?: boolean;
}

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
    ({ className, children, isLoading, ...props }, ref) => {
        return (
            <Button
                className={cn(
                    "transition-all duration-200 active:scale-95",
                    isLoading && "cursor-not-allowed opacity-70",
                    className
                )}
                disabled={isLoading || props.disabled}
                ref={ref}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </Button>
        );
    }
);
LoadingButton.displayName = "LoadingButton";

export { LoadingButton };
