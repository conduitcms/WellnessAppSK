import { useState } from "react";
import { Home, Activity, LineChart, Menu } from "lucide-react";
import { DailyChecklist } from "../components/DailyChecklist";
import SymptomTracker from "../components/SymptomTracker";
import SupplementTracker from "../components/SupplementTracker";
import HealthMetrics from "../components/HealthMetrics";
import UserProfile from "../components/UserProfile";

const TABS = [
  { id: "home", icon: Home, label: "Home" },
  { id: "track", icon: Activity, label: "Track" },
  { id: "insights", icon: LineChart, label: "Insights" },
  { id: "more", icon: Menu, label: "More" }
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabId>("home");

  return (
    <div className="min-h-screen bg-[#1C1C1E] text-white pb-16">
      <div className="container mx-auto py-6 px-4">
        {activeTab === "home" && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">
              Wellness Wisdom
            </h1>
            <SupplementTracker />
          </div>
        )}
        
        {activeTab === "track" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Track Health</h2>
            <SymptomTracker />
          </div>
        )}
        
        {activeTab === "insights" && <HealthMetrics />}
        {activeTab === "more" && <UserProfile />}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-[#2C2C2E] border-t border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex justify-around">
            {TABS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex flex-col items-center py-2 px-4 ${
                  activeTab === id ? "text-primary" : "text-gray-400"
                }`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs mt-1">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}
