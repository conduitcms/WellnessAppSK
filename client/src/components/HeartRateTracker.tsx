import { useState } from "react";

function HeartRateTracker() {
  // Placeholder data
  const [heartRateData] = useState([
    { date: "2023-09-01", bpm: 72 },
    { date: "2023-09-02", bpm: 75 },
    { date: "2023-09-03", bpm: 70 },
    // ... more placeholder entries ...
  ]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Heart Rate Tracker</h2>
      <table className="min-w-full">
        <thead>
          <tr>
            <th>Date</th>
            <th>BPM</th>
          </tr>
        </thead>
        <tbody>
          {heartRateData.map((entry) => (
            <tr key={entry.date}>
              <td>{entry.date}</td>
              <td>{entry.bpm}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default HeartRateTracker; 