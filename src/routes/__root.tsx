import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet, Link, createRootRouteWithContext, useRouter, useRouterState,
  HeadContent, Scripts,
} from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Topbar } from "@/components/topbar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { ImpersonationBanner } from "@/components/impersonation-banner";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/lib/auth";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password"];

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-display font-semibold gradient-text">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Back to dashboard</Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong. Try refreshing.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Try again</button>
          <a href="/" className="rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Edureon ERP — Enterprise School Management" },
      { name: "description", content: "Enterprise-grade multi-tenant ERP for CBSE schools and institutes." },
      { property: "og:title", content: "Edureon ERP — Enterprise School Management" },
      { name: "twitter:title", content: "Edureon ERP — Enterprise School Management" },
      { property: "og:description", content: "Enterprise-grade multi-tenant ERP for CBSE schools and institutes." },
      { name: "twitter:description", content: "Enterprise-grade multi-tenant ERP for CBSE schools and institutes." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/a6667257-b000-438f-be6a-f6c1327e69c8/id-preview-20446f9e--bcfaf169-d69f-413b-9d90-75e2bc2a39f8.lovable.app-1782194635199.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/a6667257-b000-438f-be6a-f6c1327e69c8/id-preview-20446f9e--bcfaf169-d69f-413b-9d90-75e2bc2a39f8.lovable.app-1782194635199.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppGate />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function AppGate() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  // Multi-institute users must pick an institute before entering the app.
  const instituteCount = new Set((user?.assignments ?? []).map((a) => a.instituteId)).size;
  const needsInstitute =
    !!user && user.role !== "super_admin" && !user.activeInstituteId && instituteCount > 1;
  const isSelect = pathname === "/select-institute";

  useEffect(() => {
    if (!ready) return;
    if (!user && !isPublic) router.navigate({ to: "/login" });
    if (user && isPublic) router.navigate({ to: "/" });
    if (needsInstitute && !isSelect && !isPublic) router.navigate({ to: "/select-institute" });
  }, [ready, user, isPublic, needsInstitute, isSelect, router]);

  if (isPublic) return <Outlet />;

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading workspace…
        </div>
      </div>
    );
  }

  // Institute selection is a full-screen step without the app shell.
  if (isSelect || needsInstitute) return <Outlet />;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <ImpersonationBanner />
          <main className="flex-1 min-w-0 pb-16 md:pb-0"><Outlet /></main>
        </div>
        <MobileBottomNav />
      </div>
    </SidebarProvider>
  );
}
