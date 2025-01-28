import React, { useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn, useUser } from "@clerk/clerk-react";
import ServiceList from "./components/ServiceList";
import Welcome from "./components/Welcome";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import TeamMembers from "./components/TeamMembers";
import PublicStatus from "./components/PublicStatus";
import api from "./utils/axios";
import { WebSocketProvider } from "./contexts/WebSocketContext";

if (!process.env.REACT_APP_CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isLoaded, isSignedIn, user } = useUser();
  const hasSynced = useRef(false);

  useEffect(() => {
    const syncUser = async () => {
      if (isSignedIn && user && !hasSynced.current) {
        hasSynced.current = true;
        try {
          const response = await api.post("/api/users/sync", {
            id: user.id,
            email_addresses: user.emailAddresses,
            first_name: user.firstName,
            last_name: user.lastName,
            image_url: user.imageUrl,
          });
        } catch (error) {
          console.error("Error syncing user:", error);
          hasSynced.current = false;
        }
      }
    };

    syncUser();
  }, [isSignedIn, user]);

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  return children;
};

// Layout component that includes Sidebar
const Layout = ({ children, isPublic = false }) => {
  const location = useLocation();
  const showSidebar = !isPublic && location.pathname !== "/" && location.pathname !== "/welcome";

  return (
    <div className="min-h-screen bg-gray-50">
      {!isPublic && <Header />}
      {showSidebar && <Sidebar />}
      <main className={`py-6 ${showSidebar ? "ml-64" : ""}`}>{children}</main>
    </div>
  );
};

// Public route component
const PublicRoute = ({ children }) => {
  return <Layout isPublic>{children}</Layout>;
};

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <WebSocketProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route
              path="/status/:orgId"
              element={
                <PublicRoute>
                  <PublicStatus />
                </PublicRoute>
              }
            />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Welcome />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/welcome"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Welcome />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/services"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ServiceList />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/team"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TeamMembers />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/services" replace />} />
          </Routes>
        </Router>
      </WebSocketProvider>
    </ClerkProvider>
  );
}

export default App;
