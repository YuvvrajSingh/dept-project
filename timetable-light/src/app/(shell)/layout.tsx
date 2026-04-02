import Sidebar from "@/components/sidebar";
import Header from "@/components/header";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-64 min-h-screen flex flex-col">
        <Header />
        <div className="p-8 flex-1">{children}</div>
      </main>
    </div>
  );
}
