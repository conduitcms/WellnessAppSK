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
import { insertSupplementSchema, type InsertSupplement, type Supplement } from "@db/schema";
import type { ReactElement } from "react";

// Simplified form data interface
type SupplementFormData = {
  name: string;
  dosage: string;
  frequency: string;
  reminderEnabled: boolean;
  notes: string;
};

export default function SupplementTracker(): ReactElement {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Simplified form setup
  const form = useForm<SupplementFormData>({
    defaultValues: {
      name: "",
      dosage: "",
      frequency: "",
      reminderEnabled: false,
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

  // Form submission handler
  const onSubmit = (data: SupplementFormData) => {
    console.log("Form submitted with data:", data);
    createSupplement(data);
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
                    <div>
                      <h3 className="font-medium">{supplement.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {supplement.dosage}
                      </p>
                    </div>
                    <p className="text-sm">{supplement.frequency}</p>
                  </div>
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
