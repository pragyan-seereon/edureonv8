import { ReactNode } from "react";

export function PageHeader({
  title, description, actions, eyebrow,
}: { title: string; description?: string; actions?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
      <div className="space-y-1">
        {eyebrow && (
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{eyebrow}</div>
        )}
        <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function PageContainer({ children }: { children: ReactNode }) {
  return <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">{children}</div>;
}
