import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import {
  confirmBooking,
  createAvailability,
  deleteAvailability,
  deleteQualification,
  fetchBookings,
  fetchTutorAvailability,
  fetchTutorProfile,
  rejectBooking,
  updateTutorSkills,
  uploadQualification,
} from "../../api/learning";
import {
  asArray,
  dayNames,
  defaultWeekStart,
  formatTime,
  getErrorMessage,
} from "../../utils/workspace";
import { BookingList, EmptyState, MessageBar, Panel, SoftButton } from "./WorkspacePrimitives";

export default function TutorWorkspace({ user, skills }) {
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [profile, setProfile] = useState(null);
  const [slot, setSlot] = useState({
    week_start_date: defaultWeekStart,
    day_of_week: 0,
    start_time: "09:00",
    end_time: "10:00",
  });
  const [qualification, setQualification] = useState({ skill_id: "", file: null });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedSkillObjects = useMemo(
    () => selectedSkills
      .map((id) => skills.find((skill) => skill.id === Number(id)))
      .filter(Boolean),
    [selectedSkills, skills],
  );

  const clearMessage = () => {
    setError("");
    setMessage("");
  };

  const refreshTutorData = async () => {
    const [profileData, slotData, bookingData] = await Promise.all([
      fetchTutorProfile(user.id),
      fetchTutorAvailability(user.id),
      fetchBookings({ type: "pending" }),
    ]);
    setProfile(profileData);
    setSelectedSkills(asArray(profileData.skills).map((skill) => skill.id));
    setAvailability(asArray(slotData));
    setBookings(asArray(bookingData));
  };

  useEffect(() => {
    // Initial backend hydration for tutor studio data.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshTutorData().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const saveSkills = async () => {
    try {
      await updateTutorSkills(selectedSkills.map(Number));
      setMessage("Skills updated.");
      await refreshTutorData();
    } catch (err) {
      setError(getErrorMessage(err, "Could not update skills."));
    }
  };

  const saveAvailability = async () => {
    try {
      await createAvailability({
        week_start_date: slot.week_start_date,
        slots: [{
          day_of_week: Number(slot.day_of_week),
          start_time: slot.start_time,
          end_time: slot.end_time,
        }],
      });
      setMessage("Availability saved.");
      await refreshTutorData();
    } catch (err) {
      setError(getErrorMessage(err, "Could not save availability."));
    }
  };

  const submitQualification = async () => {
    if (!qualification.skill_id || !qualification.file) {
      setError("Choose a skill and file first.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("skill_id", qualification.skill_id);
      formData.append("file", qualification.file);
      await uploadQualification(formData);
      setMessage("Qualification uploaded for review.");
      setQualification({ skill_id: "", file: null });
      await refreshTutorData();
    } catch (err) {
      setError(getErrorMessage(err, "Could not upload qualification."));
    }
  };

  const updateBooking = async (booking, action) => {
    try {
      if (action === "confirm") await confirmBooking(booking.id);
      if (action === "reject") await rejectBooking(booking.id);
      setMessage("Booking updated.");
      await refreshTutorData();
    } catch (err) {
      setError(getErrorMessage(err, "Could not update booking."));
    }
  };

  return (
    <Stack spacing={3}>
      <MessageBar error={error} message={message} onClose={clearMessage} />

      <Box className="tutor-stats">
        <Panel className="stat-card">
          <Typography color="text.secondary">Pending requests</Typography>
          <Typography component="strong">{bookings.length}</Typography>
          <Typography variant="body2">Awaiting your response</Typography>
        </Panel>
        <Panel className="stat-card">
          <Typography color="text.secondary">Skills</Typography>
          <Typography component="strong">{selectedSkillObjects.length}</Typography>
          <Typography variant="body2">Published teaching subjects</Typography>
        </Panel>
        <Panel className="stat-card">
          <Typography color="text.secondary">Average rating</Typography>
          <Typography component="strong">{profile?.average_rating || "New"}</Typography>
          <Typography variant="body2">{profile?.total_reviews || 0} reviews</Typography>
        </Panel>
      </Box>

      <Box className="tutor-grid">
        <Stack spacing={3}>
          <Panel
            title="Skills"
            subtitle="Add or manage the subjects and topics you teach."
            icon={<SchoolRoundedIcon />}
            action={<Button variant="contained" onClick={saveSkills}>Save skills</Button>}
          >
            <FormControl fullWidth>
              <InputLabel>Teaching skills</InputLabel>
              <Select
                multiple
                value={selectedSkills}
                label="Teaching skills"
                onChange={(event) => setSelectedSkills(event.target.value)}
                renderValue={() => selectedSkillObjects.map((skill) => skill.name).join(", ")}
              >
                {skills.map((skill) => (
                  <MenuItem key={skill.id} value={skill.id}>{skill.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 2 }}>
              {selectedSkillObjects.map((skill) => (
                <Chip key={skill.id} label={skill.name} className="soft-chip" />
              ))}
              {!selectedSkillObjects.length && <Typography color="text.secondary">Choose at least one skill.</Typography>}
            </Stack>
          </Panel>

          <Panel
            title="Qualifications"
            subtitle="Upload and manage educational qualifications and certificates."
            icon={<WorkspacePremiumRoundedIcon />}
          >
            <Box className="qualification-form">
              <FormControl>
                <InputLabel>Skill</InputLabel>
                <Select
                  value={qualification.skill_id}
                  label="Skill"
                  onChange={(event) => setQualification((prev) => ({ ...prev, skill_id: event.target.value }))}
                >
                  {skills.map((skill) => (
                    <MenuItem key={skill.id} value={skill.id}>{skill.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button variant="outlined" component="label" startIcon={<CloudUploadRoundedIcon />}>
                Upload proof
                <input
                  hidden
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(event) => setQualification((prev) => ({ ...prev, file: event.target.files?.[0] || null }))}
                />
              </Button>
              <Button variant="contained" onClick={submitQualification}>Submit</Button>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {qualification.file?.name || "PDF, JPG or PNG up to 5MB."}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={1}>
              {asArray(profile?.qualifications).map((item) => (
                <Box className="qualification-row" key={item.id}>
                  <Box>
                    <Typography fontWeight={800}>{item.file_name}</Typography>
                    <Typography variant="body2" color="text.secondary">{item.skill?.name}</Typography>
                  </Box>
                  <span className={`status-pill status-${item.status}`}>{item.status}</span>
                  <SoftButton size="small" onClick={() => deleteQualification(item.id).then(refreshTutorData)}>Delete</SoftButton>
                </Box>
              ))}
              {!asArray(profile?.qualifications).length && <EmptyState title="No approved qualifications yet." />}
            </Stack>
          </Panel>

          <Panel
            title="Weekly availability"
            subtitle="Set your regular weekly availability for bookings."
            icon={<CalendarMonthRoundedIcon />}
            action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={saveAvailability}>Add slot</Button>}
          >
            <Box className="availability-form">
              <TextField
                label="Week starts"
                type="date"
                value={slot.week_start_date}
                onChange={(event) => setSlot((prev) => ({ ...prev, week_start_date: event.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
              <FormControl>
                <InputLabel>Day</InputLabel>
                <Select
                  value={slot.day_of_week}
                  label="Day"
                  onChange={(event) => setSlot((prev) => ({ ...prev, day_of_week: event.target.value }))}
                >
                  {dayNames.map((name, index) => (
                    <MenuItem key={name} value={index}>{name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Start"
                type="time"
                value={slot.start_time}
                onChange={(event) => setSlot((prev) => ({ ...prev, start_time: event.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="End"
                type="time"
                value={slot.end_time}
                onChange={(event) => setSlot((prev) => ({ ...prev, end_time: event.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Box className="availability-table">
              {availability.map((item) => (
                <Box key={item.id} className="availability-slot">
                  <Typography fontWeight={800}>{dayNames[item.day_of_week]}</Typography>
                  <Typography color="text.secondary">{formatTime(item.start_time)} - {formatTime(item.end_time)}</Typography>
                  <IconButton size="small" onClick={() => deleteAvailability(item.id).then(refreshTutorData)}>
                    <CloseRoundedIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
              {!availability.length && <EmptyState title="No availability added." />}
            </Box>
          </Panel>
        </Stack>

        <Panel title="Incoming requests" subtitle="Respond to booking requests from students." icon={<CalendarMonthRoundedIcon />}>
          <BookingList
            bookings={bookings}
            emptyTitle="No incoming requests."
            actions={(booking) => (
              <>
                <Button size="small" variant="contained" onClick={() => updateBooking(booking, "confirm")}>Confirm</Button>
                <SoftButton size="small" onClick={() => updateBooking(booking, "reject")}>Reject</SoftButton>
              </>
            )}
          />
        </Panel>
      </Box>
    </Stack>
  );
}
