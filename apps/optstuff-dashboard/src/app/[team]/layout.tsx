import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="bg-background flex min-h-screen flex-col">
    <div className="flex-1">
      {children}
    </div>
    <Footer />
  </div>
}