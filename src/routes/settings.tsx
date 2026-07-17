import { createFileRoute } from "@tanstack/react-router";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { toast } from "sonner";
import {
  Building2, Palette, Globe, Shield, Database, Mail, CreditCard, Zap, CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Edureon ERP" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const [profile, setProfile] = useState({
    institute: user?.institute ?? "Mothers Public School — Unit-1",
    address: "Sector 24, Rohini, New Delhi 110085",
    phone: "+91 11 4567 8900",
    website: "https://dpsnorth.edu.in",
    about: "A premier CBSE-affiliated co-educational institution.",
    language: "en-IN",
    timezone: "Asia/Kolkata",
    currency: "INR",
  });
  const [security, setSecurity] = useState({
    enforce2FA: true, ipAllowlist: false, sso: false, passwordExpiry: true, sessionTimeout: 30,
  });

  return (
    <PageContainer>
      <PageHeader
        eyebrow="System"
        title="Settings"
        description="Institute profile, branding, integrations, security policies and backups."
      />

      <Tabs defaultValue="institute" className="space-y-5">
        <TabsList className="bg-muted/60 flex-wrap h-auto">
          <TabsTrigger value="institute"><Building2 className="h-3.5 w-3.5" />Institute</TabsTrigger>
          <TabsTrigger value="branding"><Palette className="h-3.5 w-3.5" />Branding</TabsTrigger>
          <TabsTrigger value="localization"><Globe className="h-3.5 w-3.5" />Localization</TabsTrigger>
          <TabsTrigger value="security"><Shield className="h-3.5 w-3.5" />Security</TabsTrigger>
          <TabsTrigger value="integrations"><Zap className="h-3.5 w-3.5" />Integrations</TabsTrigger>
          <TabsTrigger value="backups"><Database className="h-3.5 w-3.5" />Backups</TabsTrigger>
        </TabsList>

        <TabsContent value="institute">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-display">Institute Profile</CardTitle>
              <CardDescription>Public information displayed on receipts, certificates and notices.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Institute name"><Input value={profile.institute} onChange={(e) => setProfile({ ...profile, institute: e.target.value })} /></Field>
                <Field label="Phone"><Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></Field>
                <Field label="Website"><Input value={profile.website} onChange={(e) => setProfile({ ...profile, website: e.target.value })} /></Field>
                <Field label="CBSE Affiliation No"><Input defaultValue="2730042" /></Field>
              </div>
              <Field label="Address"><Textarea rows={2} value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} /></Field>
              <Field label="About"><Textarea rows={3} value={profile.about} onChange={(e) => setProfile({ ...profile, about: e.target.value })} /></Field>
              <div className="flex justify-end gap-2">
                <Button variant="outline">Reset</Button>
                <Button className="gradient-primary border-0" onClick={() => { updateProfile({ institute: profile.institute }); toast.success("Institute profile updated"); }}>Save changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-display">Branding & White-label</CardTitle>
              <CardDescription>Customize the look across web, mobile and parent portal.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid sm:grid-cols-3 gap-4">
                {["Primary", "Accent", "Sidebar"].map((c) => (
                  <Field key={c} label={`${c} color`}>
                    <div className="flex gap-2 items-center">
                      <div className="h-10 w-10 rounded-md border" style={{ background: c === "Primary" ? "var(--primary)" : c === "Accent" ? "var(--accent)" : "var(--sidebar)" }} />
                      <Input defaultValue={c === "Primary" ? "#1B2354" : c === "Accent" ? "#3D6FE3" : "#1A1F3A"} className="font-mono text-xs" />
                    </div>
                  </Field>
                ))}
              </div>
              <Field label="Logo">
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center text-sm text-muted-foreground">
                  Drop a PNG or SVG · max 2 MB · transparent background recommended
                </div>
              </Field>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="text-sm font-medium">Remove Edureon badge</div>
                  <div className="text-xs text-muted-foreground">White-label everything for parents and students.</div>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="localization">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-display">Localization</CardTitle>
              <CardDescription>Language, region, time zone and currency for your institute.</CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-3 gap-4">
              <Field label="Language">
                <Select value={profile.language} onValueChange={(v) => setProfile({ ...profile, language: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en-IN">English (India)</SelectItem>
                    <SelectItem value="hi-IN">हिन्दी (India)</SelectItem>
                    <SelectItem value="en-US">English (US)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Time zone">
                <Select value={profile.timezone} onValueChange={(v) => setProfile({ ...profile, timezone: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                    <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Currency">
                <Select value={profile.currency} onValueChange={(v) => setProfile({ ...profile, currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR — ₹</SelectItem>
                    <SelectItem value="USD">USD — $</SelectItem>
                    <SelectItem value="AED">AED — د.إ</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-display">Security Policies</CardTitle>
              <CardDescription>Enforce institute-wide security controls.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border/60">
              {[
                { k: "enforce2FA", label: "Enforce 2FA for staff", desc: "All employees must enable two-factor authentication." },
                { k: "ipAllowlist", label: "IP allowlist", desc: "Restrict admin access to specific networks." },
                { k: "sso", label: "Single Sign-On (SAML)", desc: "Allow login through Google Workspace or Microsoft Entra." },
                { k: "passwordExpiry", label: "Password rotation (90 days)", desc: "Force password change quarterly." },
              ].map((row) => (
                <div key={row.k} className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm font-medium">{row.label}</div>
                    <div className="text-xs text-muted-foreground">{row.desc}</div>
                  </div>
                  <Switch checked={security[row.k as keyof typeof security] as boolean} onCheckedChange={(v) => setSecurity({ ...security, [row.k]: v })} />
                </div>
              ))}
              <div className="flex items-center justify-between py-3">
                <div>
                  <div className="text-sm font-medium">Session timeout</div>
                  <div className="text-xs text-muted-foreground">Automatically sign out idle users.</div>
                </div>
                <Select value={String(security.sessionTimeout)} onValueChange={(v) => setSecurity({ ...security, sessionTimeout: parseInt(v) })}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[15, 30, 60, 120].map((m) => <SelectItem key={m} value={String(m)}>{m} min</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-display">Integrations</CardTitle>
              <CardDescription>Connect Edureon with your existing stack.</CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-3">
              {[
                { name: "Razorpay", desc: "Online fee collection", icon: CreditCard, on: true },
                { name: "Google Workspace", desc: "Meet, Calendar, Drive", icon: Mail, on: true },
                { name: "Zoom", desc: "Live classes & meetings", icon: Zap, on: false },
                { name: "WhatsApp Business", desc: "Notifications & broadcasts", icon: Mail, on: true },
                { name: "Microsoft 365", desc: "Teams, Outlook, OneDrive", icon: Mail, on: false },
                { name: "Tally", desc: "Accounting sync", icon: Database, on: false },
              ].map((it) => (
                <div key={it.name} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center"><it.icon className="h-4 w-4" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium flex items-center gap-2">
                      {it.name} {it.on && <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-[9px]"><CheckCircle2 className="h-2.5 w-2.5" />Connected</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">{it.desc}</div>
                  </div>
                  <Button size="sm" variant={it.on ? "outline" : "default"} className={it.on ? "" : "gradient-primary border-0"} onClick={() => toast.success(it.on ? "Disconnected" : "Connected")}>
                    {it.on ? "Manage" : "Connect"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backups">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-display">Backups & Data</CardTitle>
              <CardDescription>Daily encrypted snapshots stored across multiple regions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Stat label="Last backup" value="2h ago" />
                <Stat label="Storage used" value="3.2 GB" />
                <Stat label="Retention" value="90 days" />
              </div>
              <Separator />
              <div className="space-y-2">
                {[
                  { d: "Today, 06:00 AM", s: "Success", size: "412 MB" },
                  { d: "Yesterday, 06:00 AM", s: "Success", size: "405 MB" },
                  { d: "2 days ago, 06:00 AM", s: "Success", size: "401 MB" },
                ].map((b, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-md hover:bg-muted/50 text-sm">
                    <span>{b.d}</span>
                    <span className="text-muted-foreground">{b.size}</span>
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">{b.s}</Badge>
                    <Button variant="outline" size="sm" onClick={() => toast.success("Restore queued")}>Restore</Button>
                  </div>
                ))}
              </div>
              <Button className="gradient-primary border-0" onClick={() => toast.success("Backup started")}>Backup now</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{label}</Label>{children}</div>;
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-lg font-semibold mt-0.5">{value}</div>
    </div>
  );
}
