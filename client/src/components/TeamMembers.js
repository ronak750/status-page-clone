import React, { useState, useEffect } from "react";
import api from "../utils/axios";
import { useUser } from "@clerk/clerk-react";

const TeamMembers = () => {
  const { user } = useUser();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await api.get("/api/team", {
        params: { clerkId: user.id },
      });
      // console.log("Team members response:", response.data);
      setMembers(response.data);
      // Find current user's role
      const currentUser = response.data.find((m) => m.clerkId === user.id);
      //console.log("Current user:", currentUser);
      //console.log("Current user role:", currentUser?.role);
      setCurrentUserRole(currentUser?.role);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch members:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteLoading(true);
    try {
      await api.post("/api/team/invite", {
        email,
        role,
        clerkId: user.id,
      });
      console.log(user.id);
      setEmail("");
      setRole("member");
      fetchMembers();
      alert("Invitation sent successfully!");
    } catch (err) {
      console.error("Failed to send invite:", err);
      setError(err.message);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;

    try {
      await api.delete(`/api/team/${memberId}`, {
        params: { clerkId: user.id },
      });
      fetchMembers();
    } catch (err) {
      console.error("Failed to remove member:", err);
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-8 text-2xl font-bold">Team Members</h1>

        {/* Only show invite form to admins */}
        {currentUserRole === "admin" && (
          <div className="p-6 mb-8 bg-white rounded-lg shadow">
            <h2 className="mb-4 text-lg font-semibold">Invite New Member</h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="flex gap-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="flex-1 px-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="px-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {inviteLoading ? "Sending..." : "Send Invite"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Members List */}
        <div className="overflow-hidden bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Member
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Status
                </th>
                {currentUserRole === "admin" && (
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {members.map((member) => (
                <tr key={member._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-10 h-10">
                        <img
                          className="w-10 h-10 rounded-full"
                          src={member.imageUrl || "https://via.placeholder.com/40"}
                          alt=""
                        />
                      </div>
                      <div className="ml-4">
                        {member.clerkId === user.id ? (
                          <div className="text-sm font-medium text-gray-900">You</div>
                        ) : (
                          <>
                            <div className="text-sm font-medium text-gray-900">
                              {member.firstName} {member.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{member.email}</div>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {member.clerkId === user.id ? `${member.role} (You)` : member.role}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        member.status === "active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {member.status}
                    </span>
                  </td>
                  {currentUserRole === "admin" && (
                    <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                      {member.clerkId !== user.id && (
                        <button
                          onClick={() => handleRemoveMember(member._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {error && <div className="mt-4 text-red-600">{error}</div>}
      </div>
    </div>
  );
};

export default TeamMembers;
