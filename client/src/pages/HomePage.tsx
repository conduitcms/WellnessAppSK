import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SymptomTracker from "../components/SymptomTracker";
import SupplementTracker from "../components/SupplementTracker";
import HealthMetrics from "../components/HealthMetrics";
import UserProfile from "../components/UserProfile";

export default function HomePage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
        Women's Health Dashboard
      </h1>

      <Tabs defaultValue="symptoms" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="symptoms">Symptoms</TabsTrigger>
          <TabsTrigger value="supplements">Supplements</TabsTrigger>
          <TabsTrigger value="metrics">Health Metrics</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="symptoms">
          <SymptomTracker />
        </TabsContent>

        <TabsContent value="supplements">
          <SupplementTracker />
        </TabsContent>

        <TabsContent value="metrics">
          <HealthMetrics />
        </TabsContent>

        <TabsContent value="profile">
          <UserProfile />
        </TabsContent>
      </Tabs>
    </div>
  );
}
