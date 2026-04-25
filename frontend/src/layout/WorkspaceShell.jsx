import React from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import {
  Avatar,
  Badge,
  Box,
  Button,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import ReviewsRoundedIcon from "@mui/icons-material/ReviewsRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import WalletRoundedIcon from "@mui/icons-material/WalletRounded";
import { getInitials } from "../utils/workspace";

const roleCopy = {
  student: { title: "Find Tutors", subtitle: "Search, compare, and book available tutors." },
  tutor: { title: "Tutor studio", subtitle: "Manage your skills, requests, and availability." },
  admin: { title: "Admin review", subtitle: "Review tutor qualifications and platform quality." },
};

const navByRole = {
  student: [
    ["Dashboard", "/student", DashboardRoundedIcon],
    ["Find Tutors", "/student", SearchRoundedIcon],
    ["My Bookings", "/student", CalendarMonthRoundedIcon],
    ["My Learning", "/student", AutoStoriesRoundedIcon],
    ["Profile", "/student", PersonRoundedIcon],
  ],
  tutor: [
    ["Dashboard", "/tutor", DashboardRoundedIcon],
    ["Tutor studio", "/tutor", SchoolRoundedIcon],
    ["Bookings", "/tutor", CalendarMonthRoundedIcon],
    ["Earnings", "/tutor", WalletRoundedIcon],
    ["Reviews", "/tutor", ReviewsRoundedIcon],
  ],
  admin: [
    ["Dashboard", "/admin", DashboardRoundedIcon],
    ["Admin review", "/admin", VerifiedRoundedIcon],
    ["Tutors", "/admin", SchoolRoundedIcon],
    ["Reports", "/admin", AdminPanelSettingsRoundedIcon],
    ["Settings", "/admin", TuneRoundedIcon],
  ],
};

function BrandMark({ role }) {
  return (
    <Stack direction="row" spacing={1.2} alignItems="center" sx={{ px: 1.25, py: 1 }}>
      <Avatar
        sx={{
          width: 40,
          height: 40,
          bgcolor: role === "admin" ? "#ec5a94" : "rgba(169, 120, 214, 0.18)",
          color: role === "admin" ? "#fff" : "#8d54d0",
          fontWeight: 900,
        }}
      >
        Y
      </Avatar>
      <Box>
        <Typography sx={{ fontSize: 24, fontWeight: 900, color: "#ec4f8c", lineHeight: 1 }}>
          YT2UTOR
        </Typography>
        <Typography variant="caption" color="text.secondary">
          You teach. We learn.
        </Typography>
      </Box>
    </Stack>
  );
}

export default function WorkspaceShell({ role, user, onLogout, children }) {
  const location = useLocation();
  const navItems = navByRole[role] || navByRole.student;
  const copy = roleCopy[role] || roleCopy.student;

  return (
    <Box className="workspace-shell">
      <Box component="aside" className="workspace-sidebar">
        <BrandMark role={role} />
        <List sx={{ flex: 1, pt: 2 }}>
          {navItems.map(([label, path, NavIcon], index) => (
            <ListItemButton
              key={`${label}-${index}`}
              component={RouterLink}
              to={path}
              selected={location.pathname === path && index < 2}
              sx={{
                minHeight: 56,
                gap: 1.6,
                borderRadius: "8px",
                mb: 0.8,
                color: "text.secondary",
                "&.Mui-selected": {
                  color: "primary.main",
                  bgcolor: "rgba(236, 79, 140, 0.11)",
                  boxShadow: "inset 4px 0 0 #ec4f8c",
                },
              }}
            >
              {React.createElement(NavIcon, { fontSize: "small" })}
              <Typography fontWeight={700}>{label}</Typography>
            </ListItemButton>
          ))}
        </List>
        <Box className="support-card">
          <HelpOutlineRoundedIcon color="primary" />
          <Box sx={{ minWidth: 0 }}>
            <Typography fontWeight={800}>Need help?</Typography>
            <Typography variant="caption" color="text.secondary">
              Chat with support
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box className="workspace-main">
        <Box component="header" className="workspace-topbar">
          <IconButton className="mobile-menu">
            <MenuRoundedIcon />
          </IconButton>
          <TextField
            className="top-search"
            placeholder={role === "student" ? "Search tutors, subjects or topics..." : "Search"}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <Box sx={{ flex: 1 }} />
          <IconButton>
            <Badge badgeContent={role === "admin" ? 3 : 2} color="primary">
              <NotificationsNoneRoundedIcon />
            </Badge>
          </IconButton>
          <Stack direction="row" spacing={1.2} alignItems="center">
            <Avatar src={user?.profile_picture_url || undefined} sx={{ bgcolor: "primary.main" }}>
              {getInitials(user)}
            </Avatar>
            <Box className="user-copy">
              <Typography fontWeight={800}>{user?.username || user?.email || "YT2UTOR User"}</Typography>
              <Typography variant="caption" color="text.secondary">
                {role[0]?.toUpperCase() + role.slice(1)}
              </Typography>
            </Box>
            <Button onClick={onLogout} color="inherit" startIcon={<LogoutRoundedIcon />}>
              Logout
            </Button>
          </Stack>
        </Box>
        <Box component="main" className="workspace-content">
          <Box className="page-heading">
            <Typography component="h1">{copy.title}</Typography>
            <Typography>{copy.subtitle}</Typography>
          </Box>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
