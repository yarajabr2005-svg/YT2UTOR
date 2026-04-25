import React from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { formatDate, formatTime } from "../../utils/workspace";

export function Panel({ title, subtitle, icon, action, children, className = "" }) {
  return (
    <Paper elevation={0} className={`ui-panel motion-card ${className}`}>
      {(title || action) && (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          sx={{ mb: 2 }}
        >
          <Stack direction="row" spacing={1.4} alignItems="center">
            {icon && <Avatar className="panel-icon">{icon}</Avatar>}
            <Box>
              <Typography variant="h6">{title}</Typography>
              {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
            </Box>
          </Stack>
          {action}
        </Stack>
      )}
      {children}
    </Paper>
  );
}

export function EmptyState({ title = "Nothing here yet.", children, action }) {
  return (
    <Box className="empty-state">
      <CalendarMonthRoundedIcon />
      <Typography fontWeight={800}>{title}</Typography>
      {children && <Typography variant="body2" color="text.secondary">{children}</Typography>}
      {action}
    </Box>
  );
}

export function MessageBar({ error, message, onClose }) {
  if (!error && !message) return null;
  return (
    <Alert severity={error ? "error" : "success"} onClose={onClose} sx={{ borderRadius: "8px" }}>
      {error || message}
    </Alert>
  );
}

export function TutorAvatar({ tutor, size = 58 }) {
  return (
    <Avatar
      src={tutor?.profile_picture_url || undefined}
      sx={{ width: size, height: size, bgcolor: "rgba(169, 120, 214, 0.22)", color: "secondary.dark" }}
    >
      {(tutor?.username || "T")[0]}
    </Avatar>
  );
}

export function RatingLine({ rating, reviews }) {
  return (
    <Stack direction="row" spacing={0.7} alignItems="center" color="text.secondary">
      <StarRoundedIcon sx={{ color: "#f6a623", fontSize: 18 }} />
      <Typography variant="body2">
        {rating || "New"} {reviews ? `(${reviews})` : ""}
      </Typography>
    </Stack>
  );
}

export function BookingList({ bookings, actions, emptyTitle = "No bookings found." }) {
  if (!bookings.length) return <EmptyState title={emptyTitle}>Bookings will appear here as soon as they exist.</EmptyState>;
  return (
    <Stack spacing={1.2}>
      {bookings.map((booking) => (
        <Paper key={booking.id} elevation={0} className="booking-row">
          <Stack direction="row" spacing={1.4} alignItems="center" sx={{ minWidth: 0 }}>
            <Avatar className="time-dot">
              <CalendarMonthRoundedIcon fontSize="small" />
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography fontWeight={800}>{booking.skill_name || "Tutoring session"}</Typography>
              <Typography variant="body2" color="text.secondary">
                {formatDate(booking.booking_date)} · {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Tutor: {booking.tutor_email || "n/a"} · Student: {booking.student_email || "n/a"}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <span className={`status-pill status-${booking.status}`}>{booking.status}</span>
            {actions?.(booking)}
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}

export function SoftButton(props) {
  return <Button variant="outlined" color="secondary" {...props} />;
}
