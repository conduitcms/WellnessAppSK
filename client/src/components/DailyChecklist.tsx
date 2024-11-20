import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CircularProgress } from "./CircularProgress";

export function DailyChecklist() {
  const [tasks, setTasks] = useState([
    { id: 1, title: "Take morning medications", completed: false },
    { id: 2, title: "30 minutes of gentle exercise", completed: false },
    { id: 3, title: "Mindfulness meditation", completed: false }
  ]);

  const progress = Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100);

  return (
    <Card className="bg-[#2C2C2E] border-0">
      <CardHeader>
        <CardTitle className="text-white">Daily Wellness</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center mb-6">
          <CircularProgress value={progress} size={120} strokeWidth={10} />
        </div>
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center space-x-3">
              <Checkbox
                checked={task.completed}
                onCheckedChange={(checked) => {
                  setTasks(tasks.map(t =>
                    t.id === task.id ? { ...t, completed: !!checked } : t
                  ));
                }}
              />
              <label className="text-gray-300 text-sm font-medium">
                {task.title}
              </label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
