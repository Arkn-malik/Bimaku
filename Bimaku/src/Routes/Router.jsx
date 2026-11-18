import UploadPage from "../Pages/Upload/UploadPage";
import ReferensiPage from "../Pages/Referensi/ReferensiPage";
import LabelPage from "../Pages/Label/LabelPage";
import ProfilPage from "../Pages/Profil/ProfilPage";
import UserPage from "../Pages/User/UserPage";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useApp } from "../Context/AppContext";
import AdminLayout from "../Layouts/AdminLayout";
import Login from "../Pages/Auth/Login";
import DashboardPage from "../Pages/Dashboard/DashboardPage";
import ArsipPage from "../Pages/Arsip/ArsipPage";

function AdminSaja({ children }) {
  const { user } = useApp();
  return user?.role === "admin" ? children : <Navigate to="/" replace />;
}
function Guard({ children }) {
  const { user } = useApp();
  const { pathname } = useLocation();
  if (!user) return <Navigate to="/login" replace />;
  if (user.wajibGanti && pathname !== "/profil") return <Navigate to="/profil" replace />;
  return children;
}
export default function Router() {
  const { user } = useApp();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route element={<Guard><AdminLayout /></Guard>}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/arsip" element={<ArsipPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/referensi" element={<AdminSaja><ReferensiPage /></AdminSaja>} />
        <Route path="/label" element={<AdminSaja><LabelPage /></AdminSaja>} />
        <Route path="/user" element={<AdminSaja><UserPage /></AdminSaja>} />
        <Route path="/profil" element={<ProfilPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}