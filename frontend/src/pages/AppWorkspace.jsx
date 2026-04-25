import React, { useEffect, useState } from "react";
import { Box, CircularProgress, Stack } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { fetchSkills } from "../api/learning";
import WorkspaceShell from "../layout/WorkspaceShell";
import { useAuth } from "../context/AuthContext";
import { asArray } from "../utils/workspace";
import AdminWorkspace from "./workspace/AdminWorkspace";
import StudentWorkspace from "./workspace/StudentWorkspace";
import TutorWorkspace from "./workspace/TutorWorkspace";

const allowedRoutes = new Set(["student", "tutor", "admin"]);

export default function AppWorkspace() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  const userRole = user?.role || "student";
  const routeMode = location.pathname.replace("/", "") || userRole;
  const activeRole = allowedRoutes.has(routeMode) ? routeMode : userRole;
  const visibleRole = userRole === "admin" ? activeRole : userRole;

  useGSAP(() => {
    gsap.fromTo(
      ".motion-card",
      { y: 14, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.04, duration: 0.45, ease: "power2.out" },
    );
  }, [location.pathname, loading]);

  useEffect(() => {
    fetchSkills()
      .then((data) => setSkills(asArray(data)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (location.pathname === "/") {
      navigate(`/${userRole}`, { replace: true });
      return;
    }
    if (userRole !== "admin" && activeRole !== userRole) {
      navigate(`/${userRole}`, { replace: true });
    }
  }, [activeRole, location.pathname, navigate, userRole]);

  return (
    <WorkspaceShell role={visibleRole} user={user} onLogout={logout}>
      {loading ? (
        <Box className="loader-panel">
          <Stack alignItems="center" spacing={2}>
            <CircularProgress />
          </Stack>
        </Box>
      ) : (
        <>
          {visibleRole === "student" && <StudentWorkspace skills={skills} />}
          {visibleRole === "tutor" && <TutorWorkspace user={user} skills={skills} />}
          {visibleRole === "admin" && <AdminWorkspace />}
        </>
      )}
    </WorkspaceShell>
  );
}
