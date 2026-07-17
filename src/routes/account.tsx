import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/page-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth";
import { Monitor, Smartphone, Tablet, Copy, KeyRound, Trash2, LogOut } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "Account Settings — Edureon ERP" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { user, changePassword, logout } = useAuth();
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [prefs, setPrefs] = useState({
    twoFA: true, emailDigest: true, pushAlerts: true, smsAlerts: false,
    weeklyReport: true, marketing: false,
  });

  if (!user) return null;

  const savePassword = async () => {
    if (!pwd.current || !pwd.next) return toast.error("Fill both password fields");
    if (pwd.next.length < 8) return toast.error("Password must be at least 8 characters");
    if (pwd.next !== pwd.confirm) return toast.error("Passwords do not match");
    await changePassword(pwd.current, pwd.next);
    setPwd({ current: "", next: "", confirm: "" });
    toast.success("Password updated");
  };

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Account"
        title="Account Settings"
        description="Security, notifications, sessions and API access for your account."
      />

      <Tabs defaultValue="security" className="space-y-5">
        <TabsList className="bg-muted/60">
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
          <TabsTrigger value="danger" className="text-destructive data-[state=active]:text-destructive">Danger Zone</TabsTrigger>
        </TabsList>

        {/* Security */}
        <TabsContent value="security" className="space-y-5">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-display">Change Password</CardTitle>
              <CardDescription>Use a strong password unique to Edureon.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <div className="space-y-1.5"><Label className="text-xs">Current password</Label><Input type="password" value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs">New password</Label><Input type="password" value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Confirm new password</Label><Input type="password" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} /></div>
              <Button onClick={savePassword} className="gradient-primary border-0">Update password</Button>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-display">Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of protection to your account.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Authenticator app</div>
                <div className="text-xs text-muted-foreground">Use Google Authenticator, Authy or 1Password.</div>
              </div>
              <Switch checked={prefs.twoFA} onCheckedChange={(v) => { setPrefs({ ...prefs, twoFA: v }); toast.success(v ? "2FA enabled" : "2FA disabled"); }} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-display">Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to receive alerts.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border/60">
              {[
                { key: "emailDigest", label: "Daily email digest", desc: "Summary of activity each morning." },
                { key: "pushAlerts", label: "Push notifications", desc: "Real-time alerts on web and mobile." },
                { key: "smsAlerts", label: "SMS alerts", desc: "Critical alerts via SMS (carrier charges may apply)." },
                { key: "weeklyReport", label: "Weekly performance report", desc: "Every Monday at 8 AM." },
                { key: "marketing", label: "Product updates", desc: "Occasional news about new features." },
              ].map((row) => (
                <div key={row.key} className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm font-medium">{row.label}</div>
                    <div className="text-xs text-muted-foreground">{row.desc}</div>
                  </div>
                  <Switch checked={prefs[row.key as keyof typeof prefs]} onCheckedChange={(v) => setPrefs({ ...prefs, [row.key]: v })} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions */}
        <TabsContent value="sessions">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-display">Active Sessions</CardTitle>
              <CardDescription>Devices currently signed into your account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { icon: Monitor, device: "Chrome on macOS", loc: "New Delhi, IN", ip: "203.0.113.42", current: true, time: "Active now" },
                { icon: Smartphone, device: "Edureon iOS App", loc: "New Delhi, IN", ip: "203.0.113.42", current: false, time: "4 hours ago" },
                { icon: Tablet, device: "Safari on iPad", loc: "Gurugram, IN", ip: "198.51.100.7", current: false, time: "2 days ago" },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border/60 hover:bg-muted/40">
                  <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center"><s.icon className="h-4 w-4" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium flex items-center gap-2">{s.device}{s.current && <Badge variant="secondary" className="text-[9px] uppercase">This device</Badge>}</div>
                    <div className="text-xs text-muted-foreground">{s.loc} · {s.ip} · {s.time}</div>
                  </div>
                  {!s.current && <Button variant="outline" size="sm" onClick={() => toast.success("Session revoked")}>Sign out</Button>}
                </div>
              ))}
              <Separator />
              <Button variant="outline" className="w-full" onClick={() => toast.success("All other sessions signed out")}>
                <LogOut className="h-4 w-4" />Sign out all other sessions
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API */}
        <TabsContent value="api">
          <Card className="border-border/60">
            <CardHeader className="flex-row justify-between items-start space-y-0">
              <div>
                <CardTitle className="text-base font-display">API Keys</CardTitle>
                <CardDescription>Programmatic access to your institute data.</CardDescription>
              </div>
              <Button size="sm" className="gradient-primary border-0"><KeyRound className="h-4 w-4" />Generate key</Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { name: "Production · website widgets", key: "sk_live_dps_••••••••••••2f9c", created: "Oct 12, 2025", last: "2h ago" },
                { name: "Mobile app", key: "sk_live_dps_••••••••••••a4e1", created: "Aug 3, 2025", last: "5m ago" },
              ].map((k, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border/60">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{k.name}</div>
                    <div className="text-xs font-mono text-muted-foreground">{k.key}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">Created {k.created} · last used {k.last}</div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast.success("Copied")}><Copy className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Danger */}
        <TabsContent value="danger">
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="text-base font-display text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible account actions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="text-sm font-medium">Sign out everywhere</div>
                  <div className="text-xs text-muted-foreground">End all active sessions including this one.</div>
                </div>
                <Button variant="outline" onClick={() => { logout(); }}>Sign out</Button>
              </div>
              <div className="flex items-center justify-between p-3 border border-destructive/40 rounded-lg bg-destructive/5">
                <div>
                  <div className="text-sm font-medium text-destructive">Delete account</div>
                  <div className="text-xs text-muted-foreground">Permanently remove your access. This cannot be undone.</div>
                </div>
                <Button variant="destructive">Delete</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
