import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import {
  cancelBooking,
  createBooking,
  createReview,
  fetchBookings,
  fetchTutorAvailability,
  fetchTutorProfile,
  recommendTutors,
  searchTutors,
} from "../../api/learning";
import {
  asArray,
  dayNames,
  formatTime,
  getErrorMessage,
} from "../../utils/workspace";
import {
  BookingList,
  EmptyState,
  MessageBar,
  Panel,
  RatingLine,
  SoftButton,
  TutorAvatar,
} from "./WorkspacePrimitives";

export default function StudentWorkspace({ skills }) {
  const [query, setQuery] = useState("");
  const [skillId, setSkillId] = useState("");
  const [day, setDay] = useState("");
  const [time, setTime] = useState("");
  const [tutors, setTutors] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookingTab, setBookingTab] = useState("upcoming");
  const [review, setReview] = useState({ booking_id: "", rating: 5, comment: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedSkill = useMemo(
    () => skills.find((skill) => skill.id === Number(skillId)),
    [skills, skillId],
  );
  const matches = recommendations.length ? recommendations : tutors;

  const clearMessage = () => {
    setError("");
    setMessage("");
  };

  const loadBookings = async (type = bookingTab) => {
    const data = await fetchBookings({ type });
    setBookings(asArray(data));
  };

  useEffect(() => {
    // Initial backend hydration for the bookings panel.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBookings("upcoming").catch(() => setBookings([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    clearMessage();
    try {
      const params = {
        skill: selectedSkill?.name || query,
        name: selectedSkill ? "" : query,
      };
      if (day !== "" && time) {
        params.day = day;
        params.time = time;
      }
      const [searchData, aiData] = await Promise.all([
        searchTutors(params),
        recommendTutors({
          query: selectedSkill?.name || query || "learning support",
          skill_id: skillId || undefined,
          day,
          time,
        }),
      ]);
      setTutors(asArray(searchData));
      setRecommendations(asArray(aiData.recommendations));
      setSelectedTutor(null);
      setAvailability([]);
    } catch (err) {
      setError(getErrorMessage(err, "Could not search tutors."));
    } finally {
      setLoading(false);
    }
  };

  const openTutor = async (tutor) => {
    clearMessage();
    setSelectedTutor(tutor);
    try {
      const [profile, slots] = await Promise.all([
        fetchTutorProfile(tutor.id),
        fetchTutorAvailability(tutor.id),
      ]);
      setSelectedTutor(profile);
      setAvailability(asArray(slots));
    } catch (err) {
      setError(getErrorMessage(err, "Could not load tutor profile."));
    }
  };

  const requestBooking = async (slot) => {
    if (!selectedTutor || !skillId) {
      setError("Choose a skill before requesting a booking.");
      return;
    }
    try {
      await createBooking({
        tutor_id: selectedTutor.id,
        skill_id: Number(skillId),
        availability_id: slot.id,
      });
      setMessage("Booking request sent.");
      setBookingTab("pending");
      await loadBookings("pending");
    } catch (err) {
      setError(getErrorMessage(err, "Could not create booking."));
    }
  };

  const handleBookingTab = async (_, value) => {
    setBookingTab(value);
    await loadBookings(value);
  };

  const submitReview = async () => {
    try {
      await createReview({
        booking_id: review.booking_id,
        rating: Number(review.rating),
        comment: review.comment,
      });
      setMessage("Review submitted.");
      setReview({ booking_id: "", rating: 5, comment: "" });
    } catch (err) {
      setError(getErrorMessage(err, "Could not submit review."));
    }
  };

  return (
    <Stack spacing={3}>
      <MessageBar error={error} message={message} onClose={clearMessage} />

      <Panel title="Find your next tutor" subtitle="Search by subject, topic, or skill and get AI-powered recommendations.">
        <Stack spacing={2}>
          <TextField
            fullWidth
            placeholder="What do you want to learn?"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <Box className="search-controls">
            <FormControl>
              <InputLabel>Skill</InputLabel>
              <Select value={skillId} label="Skill" onChange={(event) => setSkillId(event.target.value)}>
                <MenuItem value="">Any skill</MenuItem>
                {skills.map((skill) => (
                  <MenuItem key={skill.id} value={skill.id}>{skill.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <InputLabel>Day</InputLabel>
              <Select value={day} label="Day" onChange={(event) => setDay(event.target.value)}>
                <MenuItem value="">Any day</MenuItem>
                {dayNames.map((name, index) => (
                  <MenuItem key={name} value={index}>{name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Time"
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <Button variant="contained" onClick={handleSearch} disabled={loading}>
              Search
            </Button>
          </Box>
          {selectedSkill && <Chip label={selectedSkill.name} onDelete={() => setSkillId("")} className="soft-chip" />}
          {loading && <LinearProgress />}
        </Stack>
      </Panel>

      <Box className="student-grid">
        <Panel title="AI suggestions" subtitle="Top matches for your goals and learning style." icon={<AutoAwesomeRoundedIcon />}>
          <Stack spacing={1.2}>
            {matches.map((tutor) => (
              <Box key={tutor.id} className="tutor-row">
                <Stack direction="row" spacing={1.6} alignItems="center" sx={{ minWidth: 0 }}>
                  <TutorAvatar tutor={tutor} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography fontWeight={900}>{tutor.username}</Typography>
                    <Stack direction="row" spacing={0.8} flexWrap="wrap" sx={{ my: 0.6 }}>
                      {asArray(tutor.skills).slice(0, 4).map((skill) => (
                        <Typography key={skill.id || skill} variant="caption" className="subject-text">
                          {skill.name || skill}
                        </Typography>
                      ))}
                    </Stack>
                    <RatingLine rating={tutor.average_rating} reviews={tutor.total_reviews} />
                  </Box>
                </Stack>
                <Box className="match-reason">
                  <span>Great match</span>
                  <Typography variant="body2" color="text.secondary">
                    {tutor.reason || tutor.bio || "Available for guided sessions."}
                  </Typography>
                </Box>
                <SoftButton onClick={() => openTutor(tutor)}>View profile</SoftButton>
              </Box>
            ))}
            {!matches.length && (
              <EmptyState title="Search to see tutor matches.">
                Try a skill such as Math, Physics, Python, or any available catalog subject.
              </EmptyState>
            )}
          </Stack>
        </Panel>

        <Panel title="Available slots" subtitle={selectedTutor ? selectedTutor.username : "Select a tutor to inspect availability."} icon={<CalendarMonthRoundedIcon />}>
          {selectedTutor ? (
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.4} alignItems="center">
                <TutorAvatar tutor={selectedTutor} size={72} />
                <Box>
                  <Typography fontWeight={900}>{selectedTutor.username}</Typography>
                  <RatingLine rating={selectedTutor.average_rating} reviews={selectedTutor.total_reviews} />
                </Box>
              </Stack>
              <Box className="slot-grid">
                {availability.map((slot) => (
                  <Button key={slot.id} variant="outlined" onClick={() => requestBooking(slot)}>
                    {dayNames[slot.day_of_week]} {formatTime(slot.start_time)}
                  </Button>
                ))}
              </Box>
              {!availability.length && <EmptyState title="No availability yet." />}
              <Divider />
              <Stack spacing={1.1}>
                <Typography variant="subtitle2">Booking details</Typography>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary">Subject(s)</Typography>
                  <Typography fontWeight={700}>{selectedSkill?.name || "Choose a skill"}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary">Session type</Typography>
                  <Typography fontWeight={700}>Online</Typography>
                </Stack>
                <Button variant="contained" disabled={!availability.length} onClick={() => availability[0] && requestBooking(availability[0])}>
                  Request booking
                </Button>
                <Stack direction="row" spacing={0.8} alignItems="center" color="text.secondary">
                  <ShieldRoundedIcon fontSize="small" />
                  <Typography variant="caption">Secure booking · No advance payment</Typography>
                </Stack>
              </Stack>
            </Stack>
          ) : (
            <EmptyState title="Select a tutor.">Their weekly availability and booking summary will appear here.</EmptyState>
          )}
        </Panel>
      </Box>

      <Panel title="My bookings" icon={<CalendarMonthRoundedIcon />}>
        <Tabs value={bookingTab} onChange={handleBookingTab} sx={{ mb: 2 }}>
          <Tab value="upcoming" label="Upcoming" />
          <Tab value="pending" label="Pending" />
          <Tab value="past" label="Past" />
        </Tabs>
        <BookingList
          bookings={bookings}
          actions={(booking) => (
            <>
              {booking.status !== "completed" && booking.status !== "cancelled" && (
                <SoftButton size="small" onClick={() => cancelBooking(booking.id).then(() => loadBookings(bookingTab))}>
                  Cancel
                </SoftButton>
              )}
              {booking.status === "completed" && (
                <SoftButton size="small" onClick={() => setReview((prev) => ({ ...prev, booking_id: booking.id }))}>
                  Review
                </SoftButton>
              )}
            </>
          )}
        />
        {review.booking_id && (
          <Stack spacing={2} sx={{ mt: 2 }}>
            <Divider />
            <Typography fontWeight={900}>Leave a review</Typography>
            <Box className="review-form">
              <TextField
                label="Rating"
                type="number"
                value={review.rating}
                onChange={(event) => setReview((prev) => ({ ...prev, rating: event.target.value }))}
                inputProps={{ min: 1, max: 5 }}
              />
              <TextField
                label="Comment"
                value={review.comment}
                onChange={(event) => setReview((prev) => ({ ...prev, comment: event.target.value }))}
              />
              <Button variant="contained" onClick={submitReview}>Submit</Button>
            </Box>
          </Stack>
        )}
      </Panel>
    </Stack>
  );
}
