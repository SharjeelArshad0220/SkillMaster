import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import AppShell from "./components/layout/AppShell";

import AuthPage from "./pages/AuthPage/AuthPage";
import SetupPage from "./pages/SetupPage/SetupPage";
import RoadmapPage from "./pages/RoadmapPage/RoadmapPage";
import LearnPage from "./pages/LearnPage/LearnPage";
import ProgressPage from "./pages/ProgressPage/ProgressPage";
import SessionPage from "./pages/SessionPage/SessionPage";
import NotFoundPage from "./pages/NotFoundPage/NotFoundPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/setup" element={<SetupPage />} />
              <Route element={<AppShell />}>
                <Route path="/roadmap"           element={<RoadmapPage />} />
                <Route path="/learn"             element={<LearnPage />} />
                <Route path="/progress"          element={<ProgressPage />} />
                <Route path="/session/:dayId"    element={<SessionPage />} />
              </Route>
            </Route>
            <Route path="/"  element={<Navigate to="/learn" replace />} />
            <Route path="*"  element={<NotFoundPage />} />
          </Routes>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
