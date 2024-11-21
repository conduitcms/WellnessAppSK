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
import { insertSupplementSchema, type InsertSupplement } from "@db/schema";

export default function SupplementTracker() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const defaultValues = {
    name: "",
    dosage: "",
    frequency: "",
    reminderEnabled: false,
    reminderTime: null,
    notes: "",
  };

  const form = useForm<InsertSupplement>({
    resolver: zodResolver(insertSupplementSchema),
    defaultValues,
    mode: "onBlur" // Show errors when field loses focus
  });

  const { data: supplements, isLoading: isLoadingSupplements, error: supplementsError } = useQuery({
    queryKey: ["supplements"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/supplements", {
          credentials: "include"
        });
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
        console.log('=== Starting supplement creation ===');
        console.log('Form data:', data);
        
        // Validate required fields
        if (!data.name?.trim() || !data.dosage?.trim() || !data.frequency?.trim()) {
          throw new Error('Please fill in all required fields');
        }
        
        console.log('Sending request to server');
        const response = await fetch("/api/supplements", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(data)
        });

        console.log('Server response status:', response.status);
        
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: 'Unable to parse server response' };
        }
        
        if (!response.ok) {
          console.error('Server error response:', {
            status: response.status,
            statusText: response.statusText,
            data: errorData
          });
          
          // Handle specific status codes
          switch (response.status) {
            case 401:
              throw new Error('Authentication required. Please log in again.');
            case 409:
              throw new Error('A supplement with this name already exists.');
            case 400:
              throw new Error(errorData.message || 'Invalid supplement data');
            case 500:
              throw new Error('Server error. Please try again later.');
            default:
              throw new Error(errorData.message || `Server error: ${response.status}`);
          }
        }

        if (!errorData.id || !errorData.name) {
          console.error('Invalid response format:', errorData);
          throw new Error('Invalid server response format');
        }

        return errorData;
      } catch (error) {
        console.error('Error in supplement creation:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Mutation succeeded:', data);
      
      // Reset form
      form.reset();
      
      // Invalidate and refetch supplements
      console.log('Invalidating supplements query');
      queryClient.invalidateQueries({ queryKey: ["supplements"] });
      
      toast({
        title: "Success",
        description: "Supplement added successfully"
      });
    },
    onError: (error: Error) => {
      console.error('Mutation failed:', error);
      
      // Handle specific error types
      let errorMessage = "Failed to add supplement";
      if (error.message.includes('Authentication required')) {
        errorMessage = "Please log in again to continue";
      } else if (error.message.includes('constraint')) {
        errorMessage = "This supplement already exists";
      }
      
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage
      });
      
      // Log additional error details
      console.error('Detailed error:', {
        message: error.message,
        stack: error.stack
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
              onSubmit={form.handleSubmit((data) => {
                const supplementData = {
                  ...data,
                  reminderEnabled: data.reminderEnabled || false,
                  reminderTime: data.reminderTime || null,
                  notes: data.notes || ""
                };
                
                console.log('Form data before submission:', supplementData);
                createSupplement.mutate(supplementData);
              })}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplement Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter supplement name" />
                    </FormControl>
                    <FormMessage className="text-red-500" />
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
                    <FormMessage className="text-red-500" />
                    <p className="text-sm text-muted-foreground">
                      Specify amount per dose (e.g., 500mg, 1 tablet)
                    </p>
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
                      <Input {...field} placeholder="e.g., Once daily with meals" />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                    <p className="text-sm text-muted-foreground">
                      Specify how often to take this supplement
                    </p>
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
                className="w-full"
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
          {isLoadingSupplements || createSupplement.isPending ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading supplements...</span>
            </div>
          ) : supplementsError ? (
            <div className="text-center py-4 text-destructive">
              Error loading supplements: {supplementsError.message}
            </div>
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
