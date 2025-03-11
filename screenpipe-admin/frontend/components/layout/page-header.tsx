import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 pb-8", className)}>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground max-w-[750px]">
            {description}
          </p>
        )}
      </div>
      {children && <div className="flex items-center gap-4">{children}</div>}
    </div>
  );
}

interface PageHeaderActionsProps {
  children: React.ReactNode;
  className?: string;
}

export function PageHeaderActions({
  children,
  className,
}: PageHeaderActionsProps) {
  return (
    <div className={cn("flex items-center gap-2 ml-auto", className)}>
      {children}
    </div>
  );
}

interface PageHeaderTabsProps {
  children: React.ReactNode;
  className?: string;
}

export function PageHeaderTabs({
  children,
  className,
}: PageHeaderTabsProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {children}
    </div>
  );
} 