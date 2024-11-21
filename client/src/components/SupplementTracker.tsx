import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Supplement } from "@db/schema";
import type { ReactElement } from "react";

import { z } from "zod";

// Zod schema for form validation
const supplementFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.string().min(1, "Frequency is required"),
  reminderEnabled: z.boolean(),
  reminderTime: z.string().nullable(),
  notes: z.string().optional()
});

type SupplementFormData = z.infer<typeof supplementFormSchema>;

export default function SupplementTracker(): ReactElement {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form setup with zod validation
  const form = useForm<SupplementFormData>({
    resolver: zodResolver(supplementFormSchema),
    defaultValues: {
      name: "",
      dosage: "",
      frequency: "",
      reminderEnabled: false,
      reminderTime: "08:00",
      notes: "",
    }
  });

  // Query for fetching supplements
  const { 
    data: supplements = [], 
    isLoading: isLoadingSupplements 
  } = useQuery({
    queryKey: ["supplements"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/supplements", {
          credentials: "include"
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch supplements");
        }

        const data = await response.json();
        console.log("Fetched supplements:", data);
        return data as Supplement[];
      } catch (error) {
        console.error("Error fetching supplements:", error);
        throw error;
      }
    }
  });

  // Mutation for creating supplements
  const { mutate: createSupplement, isPending } = useMutation({
    mutationFn: async (data: SupplementFormData) => {
      try {
        console.log("Sending supplement data:", data);
        const response = await fetch("/api/supplements", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to create supplement");
        }

        return response.json();
      } catch (error) {
        console.error("Error creating supplement:", error);
        throw error;
      }
    },
    onSuccess: (newSupplement) => {
      // Update the cache with the new supplement
      queryClient.setQueryData<Supplement[]>(["supplements"], (old = []) => {
        return [...old, newSupplement];
      });

      // Reset form
      form.reset();

      toast({
        title: "Success",
        description: "Supplement added successfully",
      });

      // Force a refresh of the supplements list
      queryClient.invalidateQueries({ queryKey: ["supplements"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add supplement",
      });
    },
  });

  // Add delete mutation
  const { mutate: deleteSupplement } = useMutation({
    mutationFn: async (supplementId: number) => {
      const response = await fetch(`/api/supplements/${supplementId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete supplement");
      }

      return supplementId;
    },
    onSuccess: (deletedSupplementId) => {
      // Update cache by removing the deleted supplement
      queryClient.setQueryData<Supplement[]>(["supplements"], (old = []) => {
        return old.filter(supplement => supplement.id !== deletedSupplementId);
      });

      toast({
        title: "Success",
        description: "Supplement deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete supplement",
      });
    },
  });

  // Mutation for taking supplements
  const { mutate: takeSupplement } = useMutation({
    mutationFn: async (supplementId: number) => {
      const response = await fetch(`/api/supplements/${supplementId}/take`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage: string;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || "Failed to mark supplement as taken";
        } catch (e) {
          errorMessage = errorText || response.statusText || "Failed to mark supplement as taken";
        }
        
        throw new Error(errorMessage);
      }

      const responseText = await response.text();
      if (!responseText) {
        throw new Error("Empty response from server");
      }

      try {
        const data = JSON.parse(responseText);
        if (!data || typeof data !== 'object') {
          throw new Error("Invalid response format");
        }
        return data as Supplement;
      } catch (e) {
        console.error("Error parsing response:", e, "Response text:", responseText);
        throw new Error("Invalid response format from server");
      }
    },
    onSuccess: (updatedSupplement: Supplement) => {
      queryClient.setQueryData<Supplement[]>(["supplements"], (old = []) => {
        return old.map(supplement => 
          supplement.id === updatedSupplement.id ? updatedSupplement : supplement
        );
      });

      toast({
        title: "Success",
        description: "Supplement marked as taken",
      });
    },
    onError: (error: Error) => {
      console.error("Error taking supplement:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to mark supplement as taken",
      });
    },
  });

  // Set up notifications
  React.useEffect(() => {
    const checkPermission = async () => {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        console.log('Notification permission:', permission);
      }
    };
    
    checkPermission();
  }, []);

  // Check for due supplements
  React.useEffect(() => {
    const checkDueSupplements = () => {
      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });

      supplements.forEach(supplement => {
        if (supplement.reminderEnabled && 
            supplement.reminderTime === currentTime &&
            (!supplement.lastTaken || 
             new Date(supplement.lastTaken).toDateString() !== now.toDateString())) {
          // Show notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Time to take ${supplement.name}`, {
              body: `${supplement.dosage} - ${supplement.frequency}`,
              icon: '/favicon.ico'
            });
          }
        }
      });
    };

    const interval = setInterval(checkDueSupplements, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [supplements]);

  // Form submission handler
  const onSubmit = (data: SupplementFormData) => {
    console.log("Form submitted with data:", data);
    // Send the data with reminderTime as string
    createSupplement({
      ...data,
      reminderTime: data.reminderEnabled ? data.reminderTime : null
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Add New Supplement</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter supplement name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dosage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dosage</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., 500mg" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Once daily" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reminderEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Reminders</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Get notified when it's time to take your supplement
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch("reminderEnabled") && (
                <FormField
                  control={form.control}
                  name="reminderTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reminder Time</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Button 
                type="submit" 
                disabled={isPending}
                className="w-full"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Supplement"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Supplements</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingSupplements ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading supplements...</span>
            </div>
          ) : supplements.length > 0 ? (
            <div className="space-y-4">
              {supplements.map((supplement) => (
                <div
                  key={supplement.id}
                  className="p-4 border rounded-lg space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <h3 className="font-medium">{supplement.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{supplement.dosage}</span>
                        {supplement.reminderEnabled && (
                          <>
                            <span>•</span>
                            <span>{supplement.reminderTime}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          try {
                            if (!supplement?.id) {
                              throw new Error("Invalid supplement ID");
                            }
                            takeSupplement(supplement.id);
                          } catch (error) {
                            console.error("Error handling take supplement:", error);
                            toast({
                              variant: "destructive",
                              title: "Error",
                              description: "Failed to process supplement action",
                            });
                          }
                        }}
                      >
                        Take
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this supplement?')) {
                            deleteSupplement(supplement.id);
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  {supplement.lastTaken && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Last taken: {new Date(supplement.lastTaken).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No supplements added yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
