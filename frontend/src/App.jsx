import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import { useSuperAdmin } from "./context/SuperAdminContext.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Privacy from "./pages/Privacy.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Documents from "./pages/Documents.jsx";
import Billing from "./pages/Billing.jsx";
import Team from "./pages/Team.jsx";
import Departments from "./pages/Departments.jsx";
import Settings from "./pages/Settings.jsx";
import SuperAdminLogin from "./pages/superadmin/SuperAdminLogin.jsx";
import SuperAdminDashboard from "./pages/superadmin/SuperAdminDashboard.jsx";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-paper-dim">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand/20 border-t-brand" aria-label="Chargement" />
      </div>
    );
  }
  if (!user) return <Navigate to="/connexion" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (user?.role !== "admin") return <Navigate to="/app" replace />;
  return children;
}

function SuperAdminRoute({ children }) {
  const { admin, loading } = useSuperAdmin();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-paper-dim">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand/20 border-t-brand" aria-label="Chargement" />
      </div>
    );
  }
  if (!admin) return <Navigate to="/superadmin/connexion" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/connexion" element={<Login />} />
      <Route path="/inscription" element={<Register />} />
      <Route path="/confidentialite" element={<Privacy />} />

      <Route path="/superadmin/connexion" element={<SuperAdminLogin />} />
      <Route
        path="/superadmin"
        element={
          <SuperAdminRoute>
            <SuperAdminDashboard />
          </SuperAdminRoute>
        }
      />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="documents" element={<Documents />} />
        <Route path="departements" element={<Departments />} />
        <Route
          path="facturation"
          element={
            <AdminRoute>
              <Billing />
            </AdminRoute>
          }
        />
        <Route
          path="parametres"
          element={
            <AdminRoute>
              <Settings />
            </AdminRoute>
          }
        />
        <Route
          path="equipe"
          element={
            <AdminRoute>
              <Team />
            </AdminRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
