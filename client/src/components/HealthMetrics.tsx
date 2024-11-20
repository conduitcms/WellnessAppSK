import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function HealthMetrics() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["health-metrics"],
    queryFn: async () => {
      const response = await fetch("/api/health-metrics");
      if (!response.ok) throw new Error("Failed to fetch health metrics");
      return response.json();
    },
  });

  const formatData = (data: any[], type: string) => {
    return data
      ?.filter((metric) => metric.type === type)
      .map((metric) => ({
        date: new Date(metric.date).toLocaleDateString(),
        value: metric.value,
      }));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Heart Rate</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formatData(metrics, "heart_rate")}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(335, 52%, 60%)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sleep Duration</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isLoading ? (
              <p>Loading...</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formatData(metrics, "sleep")}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(335, 52%, 60%)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Steps</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isLoading ? (
              <p>Loading...</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formatData(metrics, "steps")}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(335, 52%, 60%)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
