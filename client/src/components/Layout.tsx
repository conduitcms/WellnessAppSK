import { UserNav } from "./UserProfile";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Women's Health Tracker</h1>
          <UserNav />
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
