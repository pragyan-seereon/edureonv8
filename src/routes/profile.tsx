import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth, initials, roleLabel } from "@/lib/auth";
import { Upload, Trash2, CheckCircle2, Mail, Phone, Building2, Calendar, Shield } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "My Profile — Edureon ERP" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    designation: user?.designation ?? "",
    bio: user?.bio ?? "",
  });

  if (!user) return null;

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 1.5 * 1024 * 1024) return toast.error("Max 1.5MB image");
    const reader = new FileReader();
    reader.onload = () => {
      updateProfile({ avatar: reader.result as string });
      toast.success("Photo updated");
    };
    reader.readAsDataURL(f);
  };

  const save = () => {
    updateProfile(form);
    toast.success("Profile saved");
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Account"
        title="My Profile"
        description="Manage how you appear across Edureon and update your personal information."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left summary card */}
        <Card className="border-border/60 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-28 gradient-primary opacity-90" />
          <CardContent className="pt-16 pb-6 relative">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 ring-4 ring-background shadow-lg">
                {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold">
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
              <h2 className="font-display text-lg font-semibold mt-3">{user.name}</h2>
              <p className="text-xs text-muted-foreground">{user.designation}</p>
              <Badge variant="secondary" className="mt-2 text-[10px] uppercase tracking-wider">{roleLabel[user.role]}</Badge>

              <div className="flex gap-2 mt-4">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
                <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}><Upload className="h-3.5 w-3.5" />Upload</Button>
                {user.avatar && (
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => { updateProfile({ avatar: undefined }); toast.success("Photo removed"); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>

            <Separator className="my-5" />

            <div className="space-y-3 text-sm">
              <Row icon={Mail} label="Email" value={user.email} />
              <Row icon={Phone} label="Phone" value={user.phone || "—"} />
              <Row icon={Building2} label="Institute" value={user.institute || "—"} />
              <Row icon={Calendar} label="Joined" value={user.joinedAt || "—"} />
              <Row icon={Shield} label="2FA" value={<span className="inline-flex items-center gap-1 text-success"><CheckCircle2 className="h-3 w-3" />Enabled</span>} />
            </div>
          </CardContent>
        </Card>

        {/* Right form */}
        <div className="lg:col-span-2 space-y-5">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-display">Personal Information</CardTitle>
              <CardDescription>This information appears on your school profile and notifications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Full name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
                <Field label="Designation"><Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} /></Field>
                <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
                <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
              </div>
              <Field label="Bio">
                <Textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="A short description shown on your public profile." />
              </Field>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setForm({ name: user.name, email: user.email, phone: user.phone ?? "", designation: user.designation ?? "", bio: user.bio ?? "" })}>Reset</Button>
                <Button onClick={save} className="gradient-primary border-0">Save changes</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-display">Recent Activity</CardTitle>
              <CardDescription>Your last actions in the workspace.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { t: "Signed in from Chrome · Delhi", time: "2 minutes ago" },
                { t: "Approved fee waiver for STU1042", time: "1 hour ago" },
                { t: "Published Term 2 examination schedule", time: "Yesterday" },
                { t: "Added new employee — Priya Joshi", time: "2 days ago" },
              ].map((a, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-md hover:bg-muted/50">
                  <span className="text-sm">{a.t}</span>
                  <span className="text-xs text-muted-foreground">{a.time}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}

function Row({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-sm truncate">{value}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
