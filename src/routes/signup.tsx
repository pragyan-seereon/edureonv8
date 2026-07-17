import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Start a trial — Edureon ERP" }] }),
  component: SignupPage,
});

function SignupPage() {
  const auth = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", institute: "", password: "", agree: false });
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error("Please fill all required fields");
    if (form.password.length < 8) return toast.error("Password must be at least 8 characters");
    if (!form.agree) return toast.error("Please accept the terms to continue");
    setLoading(true);
    try {
      await auth.signup({ name: form.name, email: form.email, institute: form.institute, password: form.password });
      toast.success("Workspace created");
      router.navigate({ to: "/" });
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 mb-8 justify-center">
          <div className="h-9 w-9 rounded-md gradient-primary flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display font-semibold">Edureon ERP</span>
        </Link>

        <h1 className="font-display text-2xl font-semibold tracking-tight text-center">Start your 30-day free trial</h1>
        <p className="mt-1 text-sm text-muted-foreground text-center">No credit card required. Cancel anytime.</p>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Full name</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Rahul Kapoor" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Work email</Label>
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@institute.edu.in" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Institute name</Label>
            <Input value={form.institute} onChange={(e) => set("institute", e.target.value)} placeholder="Mothers Public School — Unit-1" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Password</Label>
            <Input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="At least 8 characters" required minLength={8} />
          </div>
          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <Checkbox checked={form.agree} onCheckedChange={(v) => set("agree", !!v)} className="mt-0.5" />
            <span>I agree to the <a className="text-primary hover:underline">Terms</a> and <a className="text-primary hover:underline">Privacy Policy</a>.</span>
          </label>
          <Button type="submit" disabled={loading} className="w-full gradient-primary border-0">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create workspace"}
          </Button>
        </form>

        <p className="mt-6 text-xs text-muted-foreground text-center">
          Already have an account? <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
