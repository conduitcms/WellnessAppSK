import { useState } from "react";

function SleepTracker() {
  // Placeholder data
  const [sleepData] = useState([
    { date: "2023-09-01", hours: 7 },
    { date: "2023-09-02", hours: 6.5 },
    { date: "2023-09-03", hours: 8 },
    // ... more placeholder entries ...
  ]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Sleep Tracker</h2>
      <table className="min-w-full">
        <thead>
          <tr>
            <th>Date</th>
            <th>Hours Slept</th>
          </tr>
        </thead>
        <tbody>
          {sleepData.map((entry) => (
            <tr key={entry.date}>
              <td>{entry.date}</td>
              <td>{entry.hours}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SleepTracker; 