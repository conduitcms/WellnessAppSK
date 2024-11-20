import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { InsertHealthMetric } from "@db/schema";

export function useHealthData() {
  const queryClient = useQueryClient();

  const metrics = useQuery({
    queryKey: ["health-metrics"],
    queryFn: async () => {
      const response = await fetch("/api/health-metrics");
      if (!response.ok) throw new Error("Failed to fetch health metrics");
      return response.json();
    },
  });

  const addMetric = useMutation({
    mutationFn: async (data: InsertHealthMetric) => {
      const response = await fetch("/api/health-metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to add health metric");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health-metrics"] });
    },
  });

  return {
    metrics: metrics.data,
    isLoading: metrics.isLoading,
    addMetric: addMetric.mutate,
  };
}
