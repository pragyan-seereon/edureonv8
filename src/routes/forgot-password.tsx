import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle2, GraduationCap, Loader2 } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — Edureon ERP" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try { await auth.forgotPassword(email); setSent(true); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center gap-2 mb-8 justify-center">
          <div className="h-9 w-9 rounded-md gradient-primary flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display font-semibold">Edureon ERP</span>
        </Link>

        {sent ? (
          <div className="text-center space-y-3">
            <div className="mx-auto h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <h1 className="font-display text-xl font-semibold">Check your inbox</h1>
            <p className="text-sm text-muted-foreground">If an account exists for <span className="font-medium text-foreground">{email}</span>, we've sent a password reset link.</p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link to="/login"><ArrowLeft className="h-4 w-4" />Back to sign in</Link>
            </Button>
          </div>
        ) : (
          <>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-center">Forgot password?</h1>
            <p className="mt-1 text-sm text-muted-foreground text-center">Enter your work email and we'll send a reset link.</p>
            <form onSubmit={submit} className="mt-7 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Work email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@institute.edu.in" required />
              </div>
              <Button type="submit" disabled={loading} className="w-full gradient-primary border-0">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
              </Button>
            </form>
            <p className="mt-6 text-xs text-muted-foreground text-center">
              <Link to="/login" className="text-primary hover:underline">Back to sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
