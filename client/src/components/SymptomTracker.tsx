import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import type { FieldValues, Path } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type Symptom } from "@db/schema";
import type { ReactElement } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import type { ControllerRenderProps } from "react-hook-form";

// Simplified form data interface
const SYMPTOM_CATEGORIES = [
  "Headache",
  "Nausea",
  "Fatigue",
  "Mood Changes",
  "Sleep Issues",
  "Cramps",
  "Bloating",
  "Other"
] as const;

type SymptomCategory = typeof SYMPTOM_CATEGORIES[number];

const MOOD_OPTIONS = [
  "Happy",
  "Calm",
  "Anxious",
  "Irritable",
  "Sad",
  "Energetic",
  "Tired",
  "Neutral"
] as const;

type MoodOption = typeof MOOD_OPTIONS[number];

type SymptomFormData = {
  category: SymptomCategory;
  severity: number;
  description: string;
  date: string;
  mood: MoodOption;
  moodIntensity: number;
};

// Define validation schema
const symptomFormSchema = z.object({
  category: z.string().nonempty("Category is required"),
  severity: z.number().min(1).max(10),
  description: z.string().max(500, "Description is too long"),
  date: z.string(),
  mood: z.string(),
  moodIntensity: z.number().min(1).max(10),
});

export default function SymptomTracker(): ReactElement {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Simplified form setup
  const form = useForm<SymptomFormData>({
    resolver: zodResolver(symptomFormSchema),
    defaultValues: {
      category: "Other",
      severity: 5,
      description: "",
      date: new Date().toISOString().split('T')[0],
      mood: "Neutral",
      moodIntensity: 5
    }
  });

  // Query for fetching symptoms
  const { 
    data: symptoms = [], 
    isLoading: isLoadingSymptoms 
  } = useQuery({
    queryKey: ["symptoms"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/symptoms", {
          credentials: "include"
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch symptoms");
        }

        const data = await response.json();
        console.log("Fetched symptoms:", data);
        return data as Symptom[];
      } catch (error) {
        console.error("Error fetching symptoms:", error);
        throw error;
      }
    }
  });

  // Mutation for creating symptoms
  const { mutate: createSymptom, isPending } = useMutation({
    mutationFn: async (data: SymptomFormData) => {
      try {
        console.log("Sending symptom data:", data);
        const response = await fetch("/api/symptoms", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to create symptom");
        }

        return response.json();
      } catch (error) {
        console.error("Error creating symptom:", error);
        throw error;
      }
    },
    onSuccess: (newSymptom: Symptom) => {
      // Update the cache with the new symptom
      queryClient.setQueryData<Symptom[]>(["symptoms"], (old = []) => {
        return [...old, newSymptom];
      });

      // Reset form
      form.reset();

      toast({
        title: "Success",
        description: "Symptom logged successfully",
      });

      // Force a refresh of the symptoms list
      queryClient.invalidateQueries({ queryKey: ["symptoms"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to log symptom",
      });
    },
  });

  // Add delete mutation
  const { mutate: deleteSymptom } = useMutation({
    mutationFn: async (symptomId: number) => {
      const response = await fetch(`/api/symptoms/${symptomId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete symptom");
      }

      return symptomId;
    },
    onSuccess: (deletedSymptomId: number) => {
      // Update cache by removing the deleted symptom
      queryClient.setQueryData<Symptom[]>(["symptoms"], (old = []) => {
        return old.filter(symptom => symptom.id !== deletedSymptomId);
      });

      toast({
        title: "Success",
        description: "Symptom deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete symptom",
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: SymptomFormData) => {
    console.log("Form submitted with data:", data);
    // Send the data with the date as a string
    createSymptom({
      ...data,
      date: data.date // Already a string from the date input
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Log New Symptom</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }: { field: ControllerRenderProps<SymptomFormData, "category"> }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        {SYMPTOM_CATEGORIES.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="severity"
                render={({ field }: { field: ControllerRenderProps<SymptomFormData, "severity"> }) => (
                  <FormItem>
                    <FormLabel>Severity (1-10)</FormLabel>
                    <FormControl>
                      <Slider
                        min={1}
                        max={10}
                        step={1}
                        value={[field.value]}
                        onValueChange={([value]: number[]) => field.onChange(value)}
                      />
                    </FormControl>
                    <div className="text-center text-sm text-muted-foreground">
                      {field.value}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }: { field: ControllerRenderProps<SymptomFormData, "date"> }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <DatePicker
                        selected={new Date(field.value)}
                        onChange={(date: Date | null) => {
                          if (date) {
                            field.onChange(date.toISOString());
                          }
                        }}
                        dateFormat="yyyy-MM-dd"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mood"
                render={({ field }: { field: ControllerRenderProps<SymptomFormData, "mood"> }) => (
                  <FormItem>
                    <FormLabel>Mood</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        {MOOD_OPTIONS.map((mood) => (
                          <option key={mood} value={mood}>
                            {mood}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="moodIntensity"
                render={({ field }: { field: ControllerRenderProps<SymptomFormData, "moodIntensity"> }) => (
                  <FormItem>
                    <FormLabel>Mood Intensity (1-10)</FormLabel>
                    <FormControl>
                      <Slider
                        min={1}
                        max={10}
                        step={1}
                        value={[field.value]}
                        onValueChange={([value]: number[]) => field.onChange(value)}
                      />
                    </FormControl>
                    <div className="text-center text-sm text-muted-foreground">
                      {field.value}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }: { field: ControllerRenderProps<SymptomFormData, "description"> }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Add any additional details" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                disabled={isPending}
                className="w-full"
              >
                {isPending ? (
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
          <CardTitle>Symptom History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingSymptoms ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading symptoms...</span>
            </div>
          ) : symptoms.length > 0 ? (
            <div className="space-y-4">
              {symptoms.map((symptom) => (
                <div
                  key={symptom.id}
                  className="p-4 border rounded-lg space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{symptom.category}</h3>
                      <div className="flex items-center gap-2">
                        {symptom.mood && (
                          <span className="text-sm bg-muted px-2 py-1 rounded">
                            Mood: {symptom.mood} ({symptom.moodIntensity}/10)
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {symptom.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm">
                        Severity: {symptom.severity}
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this symptom?')) {
                            deleteSymptom(symptom.id);
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(symptom.date).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No symptoms logged yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
