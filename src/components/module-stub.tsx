import { ReactNode, useState } from "react";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Plus, Download, ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { CrudDialog, type CrudField } from "./crud-dialog";

export function ModuleStub({
  eyebrow, title, description, features, ctaLabel = "Create New",
  icon, kpis, fields,
}: {
  eyebrow: string;
  title: string;
  description: string;
  features: { name: string; status?: "Ready" | "Beta" | "Planned"; desc: string }[];
  ctaLabel?: string;
  icon?: ReactNode;
  kpis?: { label: string; value: string }[];
  fields?: CrudField[];
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  const defaultFields: CrudField[] = fields ?? [
    { name: "title", label: "Title" },
    { name: "type", label: "Type", type: "select", options: ["Standard", "Premium", "Critical"] },
    { name: "scheduledAt", label: "Date", type: "date" },
    { name: "owner", label: "Owner" },
    { name: "notes", label: "Notes", type: "textarea" },
  ];

  return (
    <PageContainer>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={
          <>
            <Button variant="outline" size="sm"><Download className="h-4 w-4" />Export</Button>
            <Button size="sm" className="gradient-primary border-0" onClick={() => { setActive(null); setOpen(true); }}>
              <Plus className="h-4 w-4" />{ctaLabel}
            </Button>
          </>
        }
      />

      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {kpis.map((k) => (
            <Card key={k.label} className="border-border/60">
              <CardContent className="p-5">
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{k.label}</div>
                <div className="text-2xl font-display font-semibold mt-1">{k.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="border-border/60 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-[0.03]" />
        <CardContent className="p-6 md:p-8 relative">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center shrink-0">
              {icon ?? <Sparkles className="h-6 w-6 text-primary-foreground" />}
            </div>
            <div className="flex-1">
              <h2 className="font-display text-xl font-semibold mb-1">Module ready for action</h2>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Use the workflows below — each opens an editable record. Connect Lovable Cloud to persist data across devices and enable RBAC + notifications.
              </p>
              <div className="flex gap-2 mt-4">
                <Button size="sm" className="gradient-primary border-0" onClick={() => { setActive(null); setOpen(true); }}>
                  <Plus className="h-4 w-4" />Quick add
                </Button>
                <Button variant="outline" size="sm" asChild><Link to="/settings">Configure</Link></Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((f) => (
          <Card
            key={f.name}
            onClick={() => { setActive(f.name); setOpen(true); }}
            className="border-border/60 hover:border-primary/40 hover:shadow-md transition-all group cursor-pointer"
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-sm font-display">{f.name}</CardTitle>
                <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">{f.status ?? "Ready"}</Badge>
              </div>
              <CardDescription className="text-xs">{f.desc}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center text-xs text-muted-foreground group-hover:text-primary transition-colors">
                Open workflow <ArrowRight className="h-3 w-3 ml-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <CrudDialog
        open={open}
        onOpenChange={setOpen}
        title={active ? `${active}` : ctaLabel}
        description={active ? `Configure ${active.toLowerCase()} for ${title}.` : `Add a new record to ${title}.`}
        fields={defaultFields}
        submitLabel={active ? "Save" : ctaLabel}
      />
    </PageContainer>
  );
}
