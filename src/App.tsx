import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import MainPage from "./pages/MainPage";
import PanoramaPage from "./pages/PanoramaPage";
import AuthPage from "./pages/AuthPage";

const RequireAuth: React.FC<{ children: React.ReactElement }> = ({
  children,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

const App: React.FC = () => {
  const { isLoading } = useAuth();
  if (isLoading) return null;

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/viewer/:hash" element={<PanoramaPage />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <MainPage />
          </RequireAuth>
        }
      />
    </Routes>
  );
};

export default App;
