import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Users, DollarSign, TrendingUp, Wallet } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: "24",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: DollarSign,
    value: "KSh 450,000",
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
  {
    icon: Wallet,
    value: "KSh 18,750",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: TrendingUp,
    value: "+12%",
    color: "text-success",
    bgColor: "bg-success/10",
  },
];

const Dashboard = () => {
  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="border-border hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className={`inline-flex p-3 rounded-xl ${stat.bgColor} w-fit`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border">
          <CardHeader>
            <h2 className="text-xl font-semibold text-foreground">Recent Activity</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="h-10 w-10 rounded-full bg-primary/10" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <h2 className="text-xl font-semibold text-foreground">Overview</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { label: "Total", value: 100, color: "bg-primary" },
                { label: "Completed", value: 75, color: "bg-success" },
                { label: "Pending", value: 25, color: "bg-warning" },
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium">{item.value}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${item.color} transition-all duration-500`}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
