"use client";
import React from "react";
import { cn } from "@/lib/utils";

export const MovingBorder = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    borderRadius?: string;
    children: React.ReactNode;
  }
>(({ className, borderRadius, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "relative p-[2px] rounded-[inherit]",
        className
      )}
      style={{
        borderRadius: borderRadius,
        background: "linear-gradient(90deg, transparent, transparent, #feca57, #feca57, transparent, transparent)",
        backgroundSize: "300% 100%",
        animation: "pulse-border 6s ease-in-out infinite alternate",
      }}
      {...props}
    >
      <div
        className="relative rounded-[inherit] bg-black h-full w-full"
        style={{
          borderRadius: `calc(${borderRadius} - 2px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
});

MovingBorder.displayName = "MovingBorder";