import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
    },
  });

  const { data: supplements, isLoading } = useQuery({
    queryKey: ["supplements"],
    queryFn: async () => {
      const response = await fetch("/api/supplements");
      if (!response.ok) throw new Error("Failed to fetch supplements");
      return response.json();
    },
  });

  const createSupplement = useMutation({
    mutationFn: async (data: InsertSupplement) => {
      const response = await fetch("/api/supplements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create supplement");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplements"] });
      form.reset();
      toast({
        title: "Success",
        description: "Supplement added successfully",
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
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button type="submit">Add Supplement</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Supplements</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
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
