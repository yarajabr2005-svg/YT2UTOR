import React, { useEffect, useState } from "react";
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
  const [notificationCount, setNotificationCount] = useState(0);

  const userRole = user?.role || "student";
  const routeMode = location.pathname.replace("/", "") || userRole;
  const activeRole = allowedRoutes.has(routeMode) ? routeMode : userRole;
  const visibleRole = userRole === "admin" ? activeRole : userRole;
  const activeSection = (location.hash || "#dashboard").replace("#", "");

  /** Light reveal on hero/section headers only — avoids animating every list row and form field on hash change. */
  useGSAP(() => {
    const targets = gsap.utils.toArray(
      ".hero-title, .hero-sub, .eb, .marg-row, .sm, .stat-block",
    );
    if (!targets.length) return;
    gsap.fromTo(
      targets,
      { y: 8, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.04, duration: 0.38, ease: "power2.out" },
    );
  }, [location.pathname, location.hash, loading, visibleRole]);

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

  useEffect(() => {
    if (!loading && location.hash) {
      requestAnimationFrame(() => {
        document.querySelector(location.hash)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
  }, [loading, location.hash, visibleRole]);

  return (
    <WorkspaceShell
      role={visibleRole}
      user={user}
      onLogout={logout}
      notificationCount={notificationCount}
    >
      {loading ? (
        <div className="loader-panel">Loading workspace…</div>
      ) : (
        <>
          {visibleRole === "student" && (
            <StudentWorkspace
              skills={skills}
              activeSection={activeSection}
              onNotificationCountChange={setNotificationCount}
            />
          )}
          {visibleRole === "tutor" && (
            <TutorWorkspace
              skills={skills}
              activeSection={activeSection}
              onNotificationCountChange={setNotificationCount}
            />
          )}
          {visibleRole === "admin" && (
            <AdminWorkspace
              activeSection={activeSection}
              onNotificationCountChange={setNotificationCount}
            />
          )}
        </>
      )}
    </WorkspaceShell>
  );
}
