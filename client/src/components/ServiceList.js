import React, { useState, useEffect } from "react";
import api from "../utils/axios";
import StatusTimeline from "./StatusTimeline";
import { useUser } from "@clerk/clerk-react";

const ServiceList = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedServices, setExpandedServices] = useState(new Set());
  const [showIncidentForm, setShowIncidentForm] = useState(null); // serviceId or null
  const [showUpdateForm, setShowUpdateForm] = useState(null); // incidentId or null
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const { user } = useUser();
  const [userRole, setUserRole] = useState(null);

  const incidentStatuses = ["investigating", "identified", "monitoring", "resolved"];
  const serviceStatuses = ["operational", "degraded", "down"];

  useEffect(() => {
    fetchServices();
    fetchUserRole();
  }, []);

  const fetchUserRole = async () => {
    try {
      const response = await api.get("/api/team", {
        params: { clerkId: user.id },
      });
      const currentUser = response.data.find((m) => m.clerkId === user.id);
      setUserRole(currentUser?.role);
    } catch (err) {
      console.error("Failed to fetch user role:", err);
    }
  };

  const fetchServices = async () => {
    try {
      console.log("Fetching services...");
      const response = await api.get("/api/services", {
        params: { clerkId: user.id },
      });
      console.log(response.data);
      setServices(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch services:", err);
      setError(err.message);
    }
  };

  const toggleService = (serviceId) => {
    setExpandedServices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return newSet;
    });
  };

  const updateServiceStatus = async (serviceId, newStatus) => {
    console.log("ds");
    try {
      await api.patch(`/api/services/${serviceId}/status`, {
        status: newStatus,
        clerkId: user.id,
      });
      fetchServices();
    } catch (err) {
      console.error("Failed to update service status:", err);
    }
  };

  const updateIncidentStatus = async (incidentId, newStatus) => {
    try {
      await api.patch(`/api/incidents/${incidentId}`, {
        status: newStatus,
        clerkId: user.id,
      });
      fetchServices();
    } catch (err) {
      console.error("Failed to update incident status:", err);
    }
  };

  const createIncident = async (serviceId, incidentData) => {
    try {
      console.log("Creating incident:", incidentData);
      await api.post("/api/incidents", {
        ...incidentData,
        service: serviceId,
        clerkId: user.id,
      });

      setShowIncidentForm(null); // Close form
      fetchServices();
    } catch (err) {
      console.error("Failed to create incident:", err);
    }
  };

  const addIncidentUpdate = async (incidentId, updateData) => {
    try {
      await api.post(`/api/incidents/${incidentId}/updates`, {
        ...updateData,
        clerkId: user.id,
      });
      setShowUpdateForm(null);
      fetchServices();
    } catch (err) {
      console.error("Failed to add incident update:", err);
    }
  };

  const createService = async (serviceData) => {
    try {
      await api.post("/api/services", {
        ...serviceData,
        clerkId: user.id,
      });
      setShowServiceForm(false);
      fetchServices();
    } catch (err) {
      console.error("Failed to create service:", err);
    }
  };

  const updateService = async (serviceId, serviceData) => {
    console.log("dc");
    try {
      await api.patch(`/api/services/${serviceId}`, {
        ...serviceData,
        clerkId: user.id,
      });
      setEditingService(null);
      fetchServices();
    } catch (err) {
      console.error("Failed to update service:", err);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
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

  const getIncidentStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "investigating":
        return "text-yellow-600 border-yellow-200 bg-yellow-50";
      case "identified":
        return "text-orange-600 border-orange-200 bg-orange-50";
      case "monitoring":
        return "text-blue-600 border-blue-200 bg-blue-50";
      case "resolved":
        return "text-green-600 border-green-200 bg-green-50";
      default:
        return "text-gray-600 border-gray-200 bg-gray-50";
    }
  };

  const formatDateTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-GB', {
      timeZone: 'UTC',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderIncidentList = (incidents, isResolved = false) => {
    return incidents.map((incident) => (
      <div
        key={incident._id}
        className={`p-4 rounded-lg ${isResolved ? "bg-gray-50" : "bg-white border border-gray-200"}`}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h4 className="text-lg font-medium text-gray-900">{incident.title}</h4>
            <p className="mt-1 text-sm text-gray-600">{incident.description}</p>
          </div>
          <span className={`px-3 py-1 text-sm rounded-full ${getIncidentStatusColor(incident.status)}`}>
            {incident.status}
          </span>
        </div>

        {/* Updates Section */}
        <div className="mt-4 space-y-3">
          {incident.updates?.map((update, index) => (
            <div key={index} className="pl-4 border-l-2 border-gray-200">
              <p className="text-sm text-gray-600">{update.description}</p>
              <div className="flex items-center mt-1 space-x-3">
                <span className={`px-2 py-0.5 text-xs rounded-full ${getIncidentStatusColor(update.status)}`}>
                  {update.status}
                </span>
                <span className="text-xs text-gray-500">{formatDateTime(update.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Update Button */}
        <div className="mt-4">
          <button
            onClick={() => setShowUpdateForm(incident._id)}
            className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-900"
          >
            + Add Update
          </button>
        </div>

        {/* Update Form */}
        {showUpdateForm === incident._id && (
          <IncidentUpdateForm
            incidentId={incident._id}
            currentStatus={incident.status}
            onSubmit={addIncidentUpdate}
            onClose={() => setShowUpdateForm(null)}
          />
        )}
      </div>
    ));
  };

  const IncidentForm = ({ serviceId, onClose }) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState("investigating");

    const handleSubmit = (e) => {
      e.preventDefault();
      createIncident(serviceId, { title, description, status });
    };

    return (
      <div className="p-4 mt-4 bg-white rounded-lg border border-gray-200">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="block mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="block mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              rows="3"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="block mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              {incidentStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md border border-transparent hover:bg-indigo-700"
            >
              Create Incident
            </button>
          </div>
        </form>
      </div>
    );
  };

  const IncidentUpdateForm = ({ incidentId, currentStatus, onSubmit, onClose }) => {
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState(currentStatus);

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(incidentId, { description, status });
    };

    return (
      <div className="p-4 mt-4 bg-gray-50 rounded-lg">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Update Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="block mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              rows="2"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">New Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="block mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              {incidentStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md border border-transparent hover:bg-indigo-700"
            >
              Add Update
            </button>
          </div>
        </form>
      </div>
    );
  };

  const ServiceForm = ({ service, onSubmit, onClose }) => {
    const [name, setName] = useState(service?.name || "");
    const [description, setDescription] = useState(service?.description || "");

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit({ name, description });
    };

    return (
      <div className="overflow-y-auto fixed inset-0 z-50 w-full h-full bg-gray-600 bg-opacity-50">
        <div className="relative top-20 p-5 mx-auto w-96 bg-white rounded-md border shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">{service ? "Edit Service" : "New Service"}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="block mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                rows="3"
                required
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md border border-transparent hover:bg-indigo-700"
              >
                {service ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading) return <div className="mt-8 text-center text-gray-600">Loading...</div>;
  if (error) return <div className="mt-8 text-center text-red-600">{error}</div>;

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header with Add Service Button */}
      <div className="pb-6 sm:flex sm:items-center sm:justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Services</h2>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setShowServiceForm(true)}
            disabled={userRole !== "admin"}
            className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 ${
              userRole !== "admin" ? "cursor-not-allowed opacity-50" : ""
            }`}
            title={userRole !== "admin" ? "Only admins can add services" : ""}
          >
            + Add Service
          </button>
        </div>
      </div>

      {/* Service Form Modal */}
      {showServiceForm && <ServiceForm onSubmit={createService} onClose={() => setShowServiceForm(false)} />}
      {editingService && (
        <ServiceForm
          service={editingService}
          onSubmit={(data) => updateService(editingService._id, data)}
          onClose={() => setEditingService(null)}
        />
      )}

      <div className="space-y-6">
        {services.map((service) => {
          const activeIncidents = service.incidents?.filter((i) => i.status !== "resolved") || [];
          const resolvedIncidents = service.incidents?.filter((i) => i.status === "resolved") || [];
          const hasIncidents = activeIncidents.length > 0 || resolvedIncidents.length > 0;
          const isExpanded = expandedServices.has(service._id);

          return (
            <div key={service._id} className="p-6 bg-white rounded-lg shadow-md">
              <div
                className={`flex justify-between items-center mb-4 ${
                  hasIncidents ? "px-6 py-2 -mx-6 cursor-pointer hover:bg-gray-50" : ""}`}
                onClick={hasIncidents ? () => toggleService(service._id) : undefined}
              >
                <div className="flex flex-1 items-center space-x-4">
                  {hasIncidents && (
                    <svg
                      className={`w-5 h-5 transform transition-transform text-gray-500 ${
                        isExpanded ? "rotate-45" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-900">{service.name}</h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingService(service);
                        }}
                        className="ml-2 text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                    </div>
                    <p className="text-sm text-gray-500">{service.description}</p>
                  </div>
                </div>
                <select
                  className={`${getStatusColor(
                    service.status
                  )} px-3 py-1 rounded-full text-white text-sm font-medium border-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${getStatusColor(
                    service.status
                  ).replace("bg-", "")}`}
                  value={service.status}
                  onChange={(e) => updateServiceStatus(service._id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                >
                  {serviceStatuses.map((status) => (
                    <option key={status} value={status} className="text-gray-900 bg-white">
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <StatusTimeline
                serviceId={service._id}
                statusHistory={service.statusHistory || []}
                dailyWorstStatuses={service.dailyWorstStatuses || []}
              />

              <div className="mt-4">
                <button
                  onClick={() => setShowIncidentForm(service._id)}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  Add Incident
                </button>
              </div>

              {showIncidentForm === service._id && (
                <IncidentForm serviceId={service._id} onClose={() => setShowIncidentForm(null)} />
              )}

              {hasIncidents && isExpanded && (
                <div className="pt-4 mt-6 border-t border-gray-100">
                  {activeIncidents.length > 0 && (
                    <div className="mb-6">
                      <h3 className="mb-3 text-lg font-medium text-gray-900">Active Incidents</h3>
                      <div className="space-y-4">{renderIncidentList(activeIncidents)}</div>
                    </div>
                  )}

                  {resolvedIncidents.length > 0 && (
                    <div className="mt-6">
                      <h3 className="mb-3 text-lg font-medium text-gray-600">Resolved Incidents</h3>
                      <div className="space-y-4">{renderIncidentList(resolvedIncidents, true)}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ServiceList;
