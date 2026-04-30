import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Avatar } from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import { getInitials } from "../utils/workspace";

const NAV_BY_ROLE = {
  student: [
    ["dashboard", "Overview"],
    ["find", "Find tutors"],
    ["bookings", "Bookings"],
    ["learning", "Learning"],
    ["profile", "Profile"],
  ],
  tutor: [
    ["dashboard", "Studio"],
    ["skills", "Skills & proof"],
    ["requests", "Requests"],
    ["earnings", "Sessions"],
    ["reviews", "Reviews"],
    ["profile", "Profile"],
  ],
  admin: [
    ["dashboard", "Overview"],
    ["review", "Review queue"],
    ["tutors", "Tutors"],
    ["reports", "Reports"],
    ["account", "Account"],
  ],
};

const ROLE_LABEL = {
  student: "Student desk",
  tutor: "Tutor studio",
  admin: "Admin desk",
};

const pad = (n) => String(n).padStart(2, "0");

function BrandMark() {
  return (
    <div className="brand">
      YT<em>²</em>UTOR<sup>{import.meta?.env?.MODE === "production" ? "v1" : "dev"}</sup>
    </div>
  );
}

export default function WorkspaceShell({ role, user, onLogout, notificationCount = 0, children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [topSearch, setTopSearch] = useState("");
  const navItems = NAV_BY_ROLE[role] || NAV_BY_ROLE.student;
  const basePath = `/${role}`;
  const activeSection = (location.hash || "#dashboard").replace("#", "");

  const closeMobile = () => setMobileOpen(false);
  const goTo = (hash) => {
    navigate(`${basePath}#${hash}`);
    closeMobile();
  };
  const submitTopSearch = (event) => {
    event.preventDefault();
    const term = topSearch.trim();
    if (!term) return;
    if (role === "student") {
      navigate(`/student?q=${encodeURIComponent(term)}#find`);
    } else {
      navigate(`${basePath}#dashboard`);
    }
  };

  return (
    <div className={`workspace-shell ${mobileOpen ? "sidebar-open" : ""}`}>
      <aside className="workspace-sidebar">
        <BrandMark />

        <nav className="toc">
          <div className="toc-heading">{ROLE_LABEL[role] || "Workspace"}</div>
          {navItems.map(([hash, label], index) => {
            const isActive = activeSection === hash;
            return (
              <button
                key={hash}
                type="button"
                className={`toc-item ${isActive ? "is-active" : ""}`}
                onClick={() => goTo(hash)}
              >
                <span className="toc-num">{pad(index + 1)}</span>
                <span className="toc-label">{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="toc-foot">
          <button type="button" onClick={() => goTo("support")}>
            Support
          </button>
          <button type="button" onClick={() => goTo("notifications")}>
            Notifications
          </button>
          <button type="button" onClick={onLogout}>
            Sign out
          </button>
          <span style={{ marginTop: 8, textTransform: "none", letterSpacing: 0 }}>
            &copy; {new Date().getFullYear()} YT²UTOR
          </span>
        </div>
      </aside>

      {mobileOpen && <div className="sidebar-backdrop" onClick={closeMobile} />}

      <div className="workspace-main">
        <header className="workspace-topbar">
          <button
            type="button"
            className="top-icon icon-btn-mobile"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <CloseRoundedIcon /> : <MenuRoundedIcon />}
          </button>

          <form className="top-search" onSubmit={submitTopSearch}>
            <SearchRoundedIcon fontSize="small" />
            <input
              type="search"
              value={topSearch}
              onChange={(e) => setTopSearch(e.target.value)}
              placeholder={
                role === "student"
                  ? "Search tutors, subjects, topics…"
                  : role === "tutor"
                  ? "Search students, requests…"
                  : "Search uploads, tutors…"
              }
              aria-label="Workspace search"
            />
          </form>

          <div className="top-actions">
            <button
              type="button"
              className="top-icon"
              onClick={() => goTo("notifications")}
              aria-label={
                notificationCount > 0
                  ? `Notifications, ${notificationCount} pending`
                  : "Notifications"
              }
            >
              <NotificationsNoneRoundedIcon />
              {notificationCount > 0 && (
                <span className="badge">{Math.min(99, notificationCount)}</span>
              )}
            </button>
            <div className="top-user">
              <Avatar
                src={user?.profile_picture_url || undefined}
                sx={{ width: 32, height: 32, fontSize: 13 }}
              >
                {getInitials(user)}
              </Avatar>
              <div className="top-user-meta">
                <span className="name">{user?.username || user?.email || "Guest"}</span>
                <span className="role">{role}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="workspace-content">{children}</main>
      </div>
    </div>
  );
}
