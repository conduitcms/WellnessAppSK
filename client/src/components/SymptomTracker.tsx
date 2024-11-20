import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { insertSymptomSchema, type InsertSymptom } from "@db/schema";

const SYMPTOM_CATEGORIES = [
  "Pain",
  "Fatigue",
  "Mood",
  "Sleep",
  "Digestion",
  "Other",
];

export default function SymptomTracker() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertSymptom>({
    resolver: zodResolver(insertSymptomSchema),
    defaultValues: {
      category: "",
      severity: 1,
      description: "",
    },
  });

  const { data: symptoms, isLoading: isLoadingSymptoms } = useQuery({
    queryKey: ["symptoms"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/symptoms");
        if (!response.ok) {
          console.error('Failed to fetch symptoms:', await response.text());
          throw new Error("Failed to fetch symptoms");
        }
        const data = await response.json();
        console.log('Fetched symptoms:', data);
        return data;
      } catch (error) {
        console.error('Error fetching symptoms:', error);
        throw error;
      }
    },
  });

  const createSymptom = useMutation({
    mutationFn: async (data: InsertSymptom) => {
      try {
        // Validate severity is between 1 and 10
        if (data.severity < 1 || data.severity > 10) {
          throw new Error("Severity must be between 1 and 10");
        }

        const response = await fetch("/api/symptoms", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to create symptom:', errorText);
          throw new Error(errorText || "Failed to create symptom");
        }

        const result = await response.json();
        console.log('Created symptom:', result);
        return result;
      } catch (error) {
        console.error('Error creating symptom:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["symptoms"] });
      form.reset();
      toast({
        title: "Success",
        description: "Symptom logged successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to log symptom",
      });
    },
  });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Log New Symptom</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => createSymptom.mutate(data))}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SYMPTOM_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="severity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Severity (1-10)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value, 10))
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                disabled={createSymptom.isPending}
              >
                {createSymptom.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging...
                  </>
                ) : (
                  "Log Symptom"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Symptoms</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingSymptoms ? (
            <p>Loading...</p>
          ) : (
            <div className="space-y-4">
              {symptoms?.map((symptom: any) => (
                <div
                  key={symptom.id}
                  className="p-4 border rounded-lg space-y-2"
                >
                  <div className="flex justify-between">
                    <span className="font-medium">{symptom.category}</span>
                    <span>Severity: {symptom.severity}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {symptom.description}
                  </p>
                  <time className="text-xs text-muted-foreground">
                    {new Date(symptom.date).toLocaleDateString()}
                  </time>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
