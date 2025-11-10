import { ReactNode } from "react";
import { NavLink } from "./NavLink";
import { Users, DollarSign, LayoutDashboard, Menu } from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

interface LayoutProps {
  children: ReactNode;
}

const navigationItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/members", icon: Users, label: "Members" },
  { to: "/contributions", icon: DollarSign, label: "Contributions" },
];

const Navigation = ({ mobile = false }: { mobile?: boolean }) => (
  <nav className={`flex ${mobile ? 'flex-col' : 'gap-1'}`}>
    {navigationItems.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        activeClassName="bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
      >
        <item.icon className="h-5 w-5" />
        <span>{item.label}</span>
      </NavLink>
    ))}
  </nav>
);

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold text-primary">Chamas</h1>
              <div className="hidden md:block">
                <Navigation />
              </div>
            </div>
            
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="mt-8">
                  <Navigation mobile />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};
