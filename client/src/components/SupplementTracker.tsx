import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { insertSupplementSchema, type InsertSupplement } from "@db/schema";

export default function SupplementTracker() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertSupplement>({
    resolver: zodResolver(insertSupplementSchema),
    defaultValues: {
      name: "",
      dosage: "",
      frequency: "",
      reminderEnabled: false,
      reminderTime: null,
      notes: "",
    },
  });

  const { data: supplements, isLoading: isLoadingSupplements } = useQuery({
    queryKey: ["supplements"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/supplements");
        if (!response.ok) {
          console.error('Failed to fetch supplements:', await response.text());
          throw new Error("Failed to fetch supplements");
        }
        const data = await response.json();
        console.log('Fetched supplements:', data);
        return data;
      } catch (error) {
        console.error('Error fetching supplements:', error);
        throw error;
      }
    },
  });

  const createSupplement = useMutation({
    mutationFn: async (data: InsertSupplement) => {
      try {
        // Format reminder time if enabled
        if (data.reminderEnabled && data.reminderTime) {
          data.reminderTime = new Date(data.reminderTime);
        } else {
          data.reminderTime = null;
        }

        const response = await fetch("/api/supplements", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to create supplement:', errorText);
          throw new Error(errorText || "Failed to create supplement");
        }

        const result = await response.json();
        console.log('Created supplement:', result);
        return result;
      } catch (error) {
        console.error('Error creating supplement:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplements"] });
      form.reset();
      toast({
        title: "Success",
        description: "Supplement added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add supplement",
      });
    },
  });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Add New Supplement</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => createSupplement.mutate(data))}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplement Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
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
                      <Input {...field} />
                    </FormControl>
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
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reminderEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel>Enable Reminders</FormLabel>
                    <FormControl>
                      <Switch
                        checked={!!field.value}
                        onCheckedChange={(checked) => field.onChange(checked)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                disabled={createSupplement.isPending}
              >
                {createSupplement.isPending ? (
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
            <p>Loading...</p>
          ) : (
            <div className="space-y-4">
              {supplements?.map((supplement: any) => (
                <div
                  key={supplement.id}
                  className="p-4 border rounded-lg space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium text-white">{supplement.name}</span>
                      <p className="text-sm text-gray-400">{supplement.dosage}</p>
                    </div>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        toast({
                          title: "Supplement Taken",
                          description: `Marked ${supplement.name} as taken`,
                        });
                      }}
                    >
                      Take
                    </Button>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-gray-400">
                      Next dose: {supplement.reminderTime ? new Date(supplement.reminderTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Not scheduled'}
                    </p>
                    <span className="text-xs text-primary">
                      {supplement.frequency}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}