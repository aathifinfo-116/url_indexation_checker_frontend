import apiClient from "./api";
import { getAdminMe } from "./api/auth";
import React, { useContext, useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./components/Dashboard/Dashboard";
import AddNewIndexation from "./components/AddNewIndexation";
import Indexations from "./components/Indexations";
import { Context } from "./main";
// axios removed; apiClient and auth helpers handle requests
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Sidebar from "./components/Sidebar";
import "./App.css";
import OfflineAnimation from "./components/OfflineAnimation";

const App = () => {
  const {
    isAuthenticated,
    setIsAuthenticated,
    setAdmin,
  } = useContext(Context);

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Reload the page to ensure everything is re-initialized correctly
      window.location.reload();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Cleanup listeners on component unmount
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const response = await getAdminMe();
        setIsAuthenticated(true);
        setAdmin(response.data.user);
      } catch (error) {
        setIsAuthenticated(false);
        setAdmin({});
      }
    };

    if (isOnline) {
      fetchAdmin();
    }
  }, [
    isOnline,
    isAuthenticated,
    setAdmin,
    setIsAuthenticated,
  ]);

  if (!isOnline) {
    return <OfflineAnimation />;
  }

  return (
    <Router>
      {/* Show sidebar only for authenticated users */}
      {(isAuthenticated) && <Sidebar />}

      <Routes>

        {/* Admin Routes */}
        {isAuthenticated && (
          <>
            <Route path="/" element={<Dashboard />} />
            <Route path="/indexation/addnew" element={<AddNewIndexation />} />
            <Route path="/indexations" element={<Indexations />} />
          </>
        )}

        {/* Fallback route - redirect based on auth status */}
        <Route
          path="*"
          element={<Dashboard />
          }
        />
      </Routes>

      <ToastContainer position="top-center" />
    </Router>
  );
};

export default App;
