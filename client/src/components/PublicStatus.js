import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../utils/axios";
import { useWebSocket } from "../contexts/WebSocketContext";
import StatusTimeline from "./StatusTimeline";

const PublicStatus = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { orgId } = useParams();
  const { socket, joinOrg } = useWebSocket();

  const fetchStatusData = async () => {
    try {
      const response = await api.get(`/api/public/status/${orgId}`);
      console.log(response.data);
      setData(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching status:", err);
      setError("Failed to load status data");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatusData();
  }, [orgId]);

  // Join organization's WebSocket room
  useEffect(() => {
    if (socket && orgId) {
      joinOrg(orgId);

      // Listen for service updates
      socket.on("serviceUpdate", (update) => {
        setData((prevData) => {
          if (!prevData) return prevData;
          console.log("Updating services:", update);
          console.log(update);

          const updatedServices = [...prevData.services];
          console.log("Updated services:", updatedServices);
          const serviceIndex = updatedServices.findIndex((s) => s.id === update.service.id);

          switch (update.type) {
            case "create":
              updatedServices.push(update.service);
              break;
            case "update":
              if (serviceIndex !== -1) {
                // Merge the update with existing service data
                console.log(serviceIndex);
                updatedServices[serviceIndex] = {
                  ...updatedServices[serviceIndex],
                  ...update.service,
                  statusHistory: update.service.statusHistory || updatedServices[serviceIndex].statusHistory,
                  dailyWorstStatuses:
                    update.service.dailyWorstStatuses || updatedServices[serviceIndex].dailyWorstStatuses,
                };
              }
              console.log("Updated services:", updatedServices);
              break;
            case "delete":
              if (serviceIndex !== -1) {
                updatedServices.splice(serviceIndex, 1);
              }
              break;
            default:
              break;
          }

          return {
            ...prevData,
            services: updatedServices,
          };
        });
      });

      // Listen for incident updates
      socket.on("incidentUpdate", (update) => {
        //console.log("ss :", update);
        setData((prevData) => {
          if (!prevData) return prevData;

          const updatedIncidents = { ...prevData.incidents };
          console.log(updatedIncidents);
          const date = new Date(update.incident.createdAt).toLocaleDateString("en-GB");
          console.log(update);
          switch (update.type) {
            case "create":
              // Initialize array for this date if it doesn't exist

              if (!updatedIncidents[date]) {
                updatedIncidents[date] = [];
              }

              // Check if incident already exists
              const existingIndex = updatedIncidents[date].findIndex(
                (inc) => inc._id?.toString() === update.incident._id?.toString()
              );

              if (existingIndex === -1) {
                // Format incident to match public route format
                updatedIncidents[date].unshift(update.incident);
              }
              break;

            case "update":
              // Find and update the incident in its date group
              Object.keys(updatedIncidents).forEach((dateKey) => {
                const index = updatedIncidents[dateKey].findIndex(
                  (inc) => inc._id?.toString() === update.incident._id?.toString()
                );
                console.log(index);
                if (index !== -1) {
                  console.log("Hey");
                  console.log(updatedIncidents[dateKey][index]);
                  // Format incident to match public route format
                  updatedIncidents[dateKey][index] = update.incident;
                }
              });
              break;

            case "delete":
              // Remove the incident from its date group
              Object.keys(updatedIncidents).forEach((dateKey) => {
                updatedIncidents[dateKey] = updatedIncidents[dateKey].filter(
                  (inc) => inc._id?.toString() !== update.incident._id?.toString()
                );
                // Remove the date key if no incidents remain
                if (updatedIncidents[dateKey].length === 0) {
                  delete updatedIncidents[dateKey];
                }
              });
              break;

            default:
              break;
          }

          return {
            ...prevData,
            incidents: updatedIncidents,
          };
        });
      });

      return () => {
        socket.off("serviceUpdate");
        socket.off("incidentUpdate");
      };
    }
  }, [socket, orgId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  if (!data) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case "operational":
        return "bg-green-100 text-green-800";
      case "degraded":
        return "bg-yellow-100 text-yellow-800";
      case "down":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBarColor = (status) => {
    switch (status) {
      case "operational":
        return "bg-green-500";
      case "degraded":
        return "bg-yellow-500";
      case "down":
        return "bg-red-500";
      case "no_data":
        return "bg-gray-300";
      default:
        return "bg-gray-300";
    }
  };

  const getUptimeColor = (uptime) => {
    if (uptime >= 99) return "text-green-600";
    if (uptime >= 95) return "text-yellow-600";
    return "text-red-600";
  };

  const getIncidentStatusColor = (status) => {
    switch (status) {
      case "investigating":
        return "text-yellow-600";
      case "identified":
        return "text-orange-600";
      case "monitoring":
        return "text-blue-600";
      case "resolved":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">{data.organization.name} Status</h1>
        </div>
      </header>

      {/* Main content */}
      <main className="py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-6">
            {data.services.map((service) => (
              <div key={service._id} className="p-6 bg-white rounded-lg shadow">
                <div className="flex flex-col space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-semibold">{service.name}</h2>
                      <p className="text-gray-600">{service.description}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          service.status
                        )}`}
                      >
                        {service.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <StatusTimeline
                      serviceId={service._id}
                      statusHistory={service.statusHistory}
                      dailyWorstStatuses={service.dailyWorstStatuses}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Past Incidents */}

          <div className="mt-12">
            <h2 className="mb-6 text-2xl font-semibold">Past Incidents</h2>
            {/* Group incidents by date */}
            {Object.entries(data.incidents)
              .sort(([dateA], [dateB]) => {
                const a = new Date(dateA);
                const b = new Date(dateB);
                return a - b;
              })
              .map(([date, incidents]) => (
                <div key={date} className="mb-8">
                  <h3 className="mb-4 text-lg font-medium text-gray-900">{date}</h3>
                  <div className="space-y-6">
                    {incidents.map((incident) => (
                      <div key={incident.id} className="p-6 bg-white rounded-lg shadow">
                        <div className="flex justify-between items-center">
                          <h4 className="text-lg font-medium">
                            {incident.service.name}: {incident.title}
                          </h4>
                          <span className={`font-medium ${getIncidentStatusColor(incident.status)}`}>
                            {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                          </span>
                        </div>
                        <p className="mt-2 text-gray-600">{incident.description}</p>

                        {/* Incident Updates */}
                        {incident.updates && incident.updates.length > 0 && (
                          <div className="mt-4 space-y-3">
                            <h5 className="text-sm font-medium text-gray-700">Updates</h5>
                            {incident.updates.map((update, index) => (
                              <div key={`${incident.id}-update-${index}`} className="pl-4 border-l-2 border-gray-200">
                                <div className="flex justify-between items-start">
                                  <p className="text-sm text-gray-600">{update.description}</p>
                                  <div className="ml-4">
                                    <span className={`text-sm font-medium ${getIncidentStatusColor(update.status)}`}>
                                      {update.status.charAt(0).toUpperCase() + update.status.slice(1)}
                                    </span>
                                    <div className="text-xs text-gray-500">
                                      {new Date(update.timestamp).toLocaleString("en-GB", { timeZone: "UTC" })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default PublicStatus;
