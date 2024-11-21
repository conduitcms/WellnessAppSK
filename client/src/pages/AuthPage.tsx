import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "../hooks/use-user";
import { insertUserSchema } from "@db/schema";

interface AuthFormValues {
  username: string;
  email: string;
  password: string;
  name?: string;
  dateOfBirth?: Date | null;
  goals?: any[];
}

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const { login, register } = useUser();
  const { toast } = useToast();
  const form = useForm<AuthFormValues>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      name: "",
      dateOfBirth: null,
      goals: [],
    },
  });

  async function onSubmit(data: AuthFormValues) {
    try {
      // Only include required fields for login
      const loginData = isLogin ? {
        username: data.username,
        email: data.email,
        password: data.password,
      } : data;
      
      const result = await (isLogin ? login(loginData) : register(data));
      if (!result.ok) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    }
  }

  return (
    <div className="container max-w-md mx-auto flex items-center min-h-screen py-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Welcome to Women's Health</CardTitle>
          <CardDescription>
            {isLogin
              ? "Sign in to your account"
              : "Create an account to start tracking your health"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!isLogin && (
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-col space-y-2">
                {isLogin && (
                  <Button
                    type="button"
                    variant="link"
                    className="px-0 font-normal"
                    onClick={() => setShowPasswordReset(true)}
                  >
                    Forgot password?
                  </Button>
                )}
                <Button type="submit">
                  {isLogin ? "Sign In" : "Create Account"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsLogin(!isLogin)}
                >
                  {isLogin
                    ? "Need an account? Sign up"
                    : "Already have an account? Sign in"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
