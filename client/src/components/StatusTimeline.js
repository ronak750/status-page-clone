import React from "react";

const StatusTimeline = ({ serviceId, statusHistory, dailyWorstStatuses }) => {
  // Process status history for the timeline
  console.log("Heyy");
  const processStatusHistory = () => {
    const days = [];
    const today = new Date();
    // Convert to UTC
    today.setUTCHours(0, 0, 0, 0);
    const startDate = new Date(today);
    startDate.setUTCDate(startDate.getUTCDate() - 89);

    // Create a map of dates to their worst status
    const statusMap = new Map(
      dailyWorstStatuses.map((day) => {
        const dayDate = new Date(day.date);
        dayDate.setUTCHours(0, 0, 0, 0);
        return [
          dayDate.toISOString().split("T")[0], // Use YYYY-MM-DD as key
          {
            status: day.status || "no_data",
            details:
              statusHistory.find((h) => {
                const historyDate = new Date(h.date);
                historyDate.setUTCHours(0, 0, 0, 0);
                return historyDate.toISOString().split("T")[0] === dayDate.toISOString().split("T")[0];
              })?.statuses || [],
          },
        ];
      })
    );

    // Fill in the last 90 days
    for (let d = new Date(startDate); d <= today; d.setUTCDate(d.getUTCDate() + 1)) {
      const dateKey = new Date(d);
      dateKey.setUTCHours(0, 0, 0, 0);

      const dayData = statusMap.get(dateKey.toISOString().split("T")[0]) || {
        status: "no_data",
        details: [],
      };

      days.push({
        date: dateKey,
        status: dayData.status,
        details: dayData.details,
      });
    }

    return days;
  };

  const timelineData = processStatusHistory();

  // Calculate uptime percentage (only counting operational as uptime)
  const calculateUptime = () => {
    const operationalDays = timelineData.filter((day) => day.status === "operational").length;
    return ((operationalDays / timelineData.length) * 100).toFixed(2);
  };

  // Get color based on status
  const getStatusColor = (day) => {
    if (day.status === "no_data" || !day.details || day.details.length === 0) {
      return "bg-gray-200"; // No data
    }

    // Sort by severity: down > degraded > operational
    const worstStatus = day.details
      .map((s) => s.value)
      .sort((a, b) => {
        const severity = { down: 3, degraded: 2, operational: 1 };
        return severity[b] - severity[a];
      })[0];

    switch (worstStatus) {
      case "operational":
        return "bg-green-500";
      case "degraded":
        return "bg-yellow-500";
      case "down":
        return "bg-red-500";
      default:
        return "bg-gray-200";
    }
  };

  // Get human-readable status text with details
  const getStatusText = (day) => {
    const formattedDate = day.date.toLocaleDateString();
    let text = `${formattedDate}: ${
      day.status === "no_data" ? "No Data" : day.status.charAt(0).toUpperCase() + day.status.slice(1)
    }`;

    // Add status change details if available
    if (day.details && day.details.length > 0) {
      text += "\n\nStatus changes:";
      day.details.forEach((status) => {
        const time = new Date(status.timestamp).toLocaleTimeString();
        text += `\n${time}: ${status.value}`;
      });
    }

    return text;
  };

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-2 text-sm text-gray-600">
        <span>90 days ago</span>
        <span>{calculateUptime()}% uptime</span>
        <span>Today</span>
      </div>
      <div className="flex gap-px h-8">
        {timelineData.map((day) => (
          <div
            key={day.date.toISOString()}
            className={`flex-1 transition-opacity ${getStatusColor(day)} hover:opacity-75`}
            title={getStatusText(day)}
          />
        ))}
      </div>
      <div className="flex justify-end items-center mt-2 text-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="mr-1 w-3 h-3 bg-green-500 rounded-sm" />
            <span className="text-gray-600">Operational</span>
          </div>
          <div className="flex items-center">
            <div className="mr-1 w-3 h-3 bg-yellow-500 rounded-sm" />
            <span className="text-gray-600">Degraded</span>
          </div>
          <div className="flex items-center">
            <div className="mr-1 w-3 h-3 bg-red-500 rounded-sm" />
            <span className="text-gray-600">Down</span>
          </div>
          <div className="flex items-center">
            <div className="mr-1 w-3 h-3 bg-gray-200 rounded-sm" />
            <span className="text-gray-600">No data</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusTimeline;
