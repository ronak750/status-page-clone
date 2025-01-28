import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import api from '../utils/axios';

const Welcome = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [orgName, setOrgName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkOrganization = async () => {
      try {
        const response = await api.get("/api/users/me", {
          params: { clerkId: user.id }
        });
        if (response.data.organizationId) {
          navigate("/services");
        }
      } catch (err) {
        console.error("Error checking organization:", err);
      } finally {
        setIsLoading(false);
      }
    };

    checkOrganization();
  }, [user, navigate]);

  const handleCreateOrg = async () => {
    if (!orgName.trim()) {
      setError("Please enter an organization name");
      return;
    }

    setIsCreating(true);
    setError("");

    try {
      await api.post("/api/organizations", {
        name: orgName,
        adminId: user.id,
      });
      setIsSuccess(true);
    } catch (err) {
      setError("Failed to create organization. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="p-8 w-full max-w-md text-center bg-white rounded-lg shadow-lg">
          <div className="mb-6 text-green-600">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mb-4 text-3xl font-bold text-gray-900">Organization Created!</h1>
          <p className="mb-8 text-gray-600">Your organization has been created successfully.</p>
          <button
            onClick={() => navigate("/services")}
            className="px-6 py-3 w-full text-white bg-blue-600 rounded-lg shadow transition-colors hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="p-8 w-full max-w-md text-center bg-white rounded-lg shadow-lg">
        <h1 className="mb-4 text-3xl font-bold text-gray-900">🎉 Welcome to Status Page!</h1>
        <p className="mb-8 text-gray-600">Let's get started by creating your organization.</p>
        <div className="space-y-4">
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="Enter organization name"
            className="px-4 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <button
            onClick={handleCreateOrg}
            disabled={isCreating}
            className="px-6 py-3 w-full text-white bg-blue-600 rounded-lg shadow transition-colors hover:bg-blue-700 disabled:bg-blue-400"
          >
            {isCreating ? "Creating..." : "Create Organization"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
