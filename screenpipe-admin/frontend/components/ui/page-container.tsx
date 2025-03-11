import * as React from "react"
import { cn } from "@/lib/utils"

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  fullWidth?: boolean
}

export function PageContainer({
  children,
  className,
  fullWidth = false,
  ...props
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "px-4 py-6 md:py-10",
        fullWidth ? "container-fluid" : "container",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  actions?: React.ReactNode
}

export function PageHeader({
  title,
  description,
  actions,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 md:flex-row md:items-center md:justify-between mb-8",
        className
      )}
      {...props}
    >
      <div className="space-y-2">
        <h1 className="canva-title">{title}</h1>
        {description && (
          <p className="canva-subtitle">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3 mt-4 md:mt-0">{actions}</div>
      )}
    </div>
  )
}

interface PageSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function PageSection({
  title,
  description,
  children,
  className,
  ...props
}: PageSectionProps) {
  return (
    <section
      className={cn("space-y-4 mb-10", className)}
      {...props}
    >
      {(title || description) && (
        <div className="space-y-1">
          {title && <h2 className="text-xl font-semibold tracking-tight">{title}</h2>}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div>{children}</div>
    </section>
  )
}

interface PageGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  columns?: number
}

export function PageGrid({
  children,
  className,
  columns = 3,
  ...props
}: PageGridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  }[columns] || "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

  return (
    <div
      className={cn(
        "grid gap-4 md:gap-6",
        gridCols,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { PageContainer, PageHeader, PageSection, PageGrid } 