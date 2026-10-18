import { FinanProvider } from "@/components/finan-provider";
import { DashboardShell } from "@/components/layout/dashboard-shell";

// App local-first: sem login/banco. Estado em localStorage via FinanProvider.
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FinanProvider>
      <DashboardShell>{children}</DashboardShell>
    </FinanProvider>
  );
}
