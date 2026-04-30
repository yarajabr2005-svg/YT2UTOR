import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Tabs, Tab, LinearProgress } from "@mui/material";
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
import { useAuth } from "../../context/AuthContext";
import { useFeedback } from "../../context/FeedbackContext";
import {
  asArray,
  dayNames,
  formatDate,
  formatTime,
  getErrorMessage,
} from "../../utils/workspace";
import {
  EdField,
  EmptyState,
  FieldChip,
  Hero,
  InkPill,
  ProfilePhotoUpload,
  SectionMarker,
  StampButton,
  StatBlock,
  TutorCard,
  Eyebrow,
} from "../../components/editorial";

const TIME_OPTIONS = [
  { value: "", label: "Any time" },
  { value: "08:00", label: "8 AM" },
  { value: "10:00", label: "10 AM" },
  { value: "12:00", label: "12 PM" },
  { value: "14:00", label: "2 PM" },
  { value: "16:00", label: "4 PM" },
  { value: "18:00", label: "6 PM" },
  { value: "20:00", label: "8 PM" },
];

export default function StudentWorkspace({ skills, activeSection = "dashboard", onNotificationCountChange }) {
  const location = useLocation();
  const { user, updateProfile, uploadAvatar, changePassword } = useAuth();
  const { notify, confirm } = useFeedback();

  const [query, setQuery] = useState("");
  const [skillId, setSkillId] = useState("");
  const [day, setDay] = useState("");
  const [time, setTime] = useState("");
  const [tutors, setTutors] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const bookingRequestLock = useRef(false);
  const [availability, setAvailability] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [pastBookings, setPastBookings] = useState([]);
  const [bookingTab, setBookingTab] = useState("upcoming");
  const [review, setReview] = useState({ booking_id: "", rating: 5, comment: "" });
  const [profileForm, setProfileForm] = useState({
    username: user?.username || "",
    bio: user?.bio || "",
  });
  const [loading, setLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ old_password: "", new_password: "" });
  const [pendingForBadge, setPendingForBadge] = useState(0);

  const selectedSkill = useMemo(
    () => skills.find((s) => s.id === Number(skillId)),
    [skills, skillId],
  );
  const matches = recommendations.length ? recommendations : tutors;

  const syncNotificationCount = useCallback(async () => {
    try {
      const d = await fetchBookings({ type: "pending" });
      const n = asArray(d).length;
      setPendingForBadge(n);
      if (onNotificationCountChange) onNotificationCountChange(n);
    } catch {
      setPendingForBadge(0);
      if (onNotificationCountChange) onNotificationCountChange(0);
    }
  }, [onNotificationCountChange]);

  const loadBookings = async (type = bookingTab) => {
    const data = await fetchBookings({ type });
    setBookings(asArray(data));
  };

  useEffect(() => {
    void syncNotificationCount();
    loadBookings("upcoming").catch(() => setBookings([]));
    fetchBookings({ type: "past" })
      .then((d) => setPastBookings(asArray(d)))
      .catch(() => setPastBookings([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setProfileForm({
      username: user?.username || "",
      bio: user?.bio || "",
    });
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = async (override = query) => {
    setLoading(true);
    try {
      const term = typeof override === "string" ? override : query;
      const params = { skill: selectedSkill?.name || term, name: selectedSkill ? "" : term };
      if (day !== "" && time) { params.day = day; params.time = time; }
      const [searchData, aiData] = await Promise.all([
        searchTutors(params),
        recommendTutors({
          query: selectedSkill?.name || term || "learning support",
          skill_id: skillId || undefined,
          day, time,
        }),
      ]);
      setTutors(asArray(searchData));
      setRecommendations(asArray(aiData.recommendations));
      setSelectedTutor(null);
      setSelectedSlot(null);
      setAvailability([]);
    } catch (err) {
      notify.error(getErrorMessage(err, "Could not search tutors."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const next = new URLSearchParams(location.search).get("q") || "";
    if (!next) return;
    setQuery(next);
    handleSearch(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const openTutor = async (tutor) => {
    setSelectedTutor(tutor);
    setSelectedSlot(null);
    try {
      const [profile, slots] = await Promise.all([
        fetchTutorProfile(tutor.id),
        fetchTutorAvailability(tutor.id),
      ]);
      setSelectedTutor(profile);
      setAvailability(asArray(slots));
    } catch (err) {
      notify.error(getErrorMessage(err, "Could not load tutor profile."));
    }
  };

  const requestBooking = async (slot) => {
    if (!selectedTutor || !skillId) {
      notify.warning("Choose a skill before requesting a booking.");
      return;
    }
    if (!slot) {
      notify.warning("Select a time slot first, then use Request booking.");
      return;
    }
    if (bookingRequestLock.current) return;
    bookingRequestLock.current = true;
    setBookingSubmitting(true);
    try {
      await createBooking({
        tutor_id: selectedTutor.id,
        skill_id: Number(skillId),
        availability_id: slot.id,
      });
      notify.success("Booking request sent.");
      setBookingTab("pending");
      setSelectedSlot(null);
      await loadBookings("pending");
      await syncNotificationCount();
    } catch (err) {
      notify.error(getErrorMessage(err, "Could not create booking."));
    } finally {
      bookingRequestLock.current = false;
      setBookingSubmitting(false);
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
      notify.success("Review submitted.");
      setReview({ booking_id: "", rating: 5, comment: "" });
    } catch (err) {
      notify.error(getErrorMessage(err, "Could not submit review."));
    }
  };

  const saveProfile = async () => {
    try {
      await updateProfile(profileForm);
      notify.success("Profile updated.");
    } catch (err) {
      notify.error(getErrorMessage(err, "Could not update profile."));
    }
  };

  const savePassword = async () => {
    if (!passwordForm.new_password) {
      notify.warning("Enter a new password.");
      return;
    }
    try {
      await changePassword({
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      });
      notify.success("Password updated.");
      setPasswordForm({ old_password: "", new_password: "" });
    } catch (err) {
      notify.error(getErrorMessage(err, "Could not change password."));
    }
  };

  const onCancelBooking = async (bookingId) => {
    const ok = await confirm({
      title: "Cancel this booking request?",
      description: "The tutor will no longer see this session on their calendar. You can book again at any time.",
      confirmLabel: "Yes, cancel",
      cancelLabel: "Keep it",
      danger: true,
    });
    if (!ok) return;
    try {
      await cancelBooking(bookingId);
      notify.success("Booking cancelled.");
      await loadBookings(bookingTab);
      await syncNotificationCount();
    } catch (err) {
      notify.error(getErrorMessage(err, "Could not cancel booking."));
    }
  };

  const counts = bookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});

  const heroNode = (
    <Hero
      eyebrow="Student desk"
      title={["Learn faster with the ", { em: "right tutor" }, "."]}
      sub="Search by goal, inspect real availability, compare tutor proof, and book the next session — without leaving the workspace."
      actions={[
        <StampButton key="find" variant="primary" onClick={() => window.location.assign("/student#find")}>
          Find a tutor &nbsp;&rsaquo;
        </StampButton>,
        <StampButton key="book" variant="ghost" onClick={() => window.location.assign("/student#bookings")}>
          My bookings
        </StampButton>,
      ]}
      marginalia={[
        { k: "Active matches", v: matches.length || "—" },
        { k: "Open bookings", v: bookings.length },
        { k: "Completed", v: pastBookings.length },
      ]}
    />
  );

  const dashboardView = (
    <>
      {heroNode}
      <SectionMarker index={1} label="At a glance" meta="Today" id="dashboard" />
      <div className="stat-grid-3">
        <StatBlock value={matches.length || 0} label="Visible matches" italic />
        <StatBlock value={counts.pending || 0} label="Pending requests" />
        <StatBlock value={counts.confirmed || 0} label="Confirmed sessions" />
      </div>
      <SectionMarker index={2} label="Next up" meta="Recent bookings" />
      {bookings.length === 0 ? (
        <EmptyState
          title="No bookings on the calendar yet."
          meta="Browse tutors and reserve your first session."
          action={<StampButton variant="accent" onClick={() => window.location.assign("/student#find")}>Find a tutor</StampButton>}
        />
      ) : (
        bookings.slice(0, 4).map((b) => <BookingRow key={b.id} booking={b} />)
      )}
    </>
  );

  const findView = (
    <>
      <SectionMarker index={1} label="Find a tutor" meta={`${matches.length} match${matches.length === 1 ? "" : "es"}`} id="find" />
      <Eyebrow>Search</Eyebrow>
      <h2 style={{ fontFamily: "var(--serif)", fontSize: "clamp(40px, 5vw, 72px)", margin: "8px 0 24px", lineHeight: 1.02, fontWeight: 400 }}>
        What do you want to <span className="text-accent-rose" style={{ fontWeight: 600 }}>learn</span>?
      </h2>

      <EdField
        label="Topic"
        placeholder="Calculus, conversational French, React hooks…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="chip-row" style={{ marginTop: 24 }}>
        <FieldChip
          k="Skill"
          v={selectedSkill?.name}
          options={[
            { value: "", label: "Any skill" },
            ...skills.map((s) => ({ value: s.id, label: s.name })),
          ]}
          onChange={(v) => setSkillId(v)}
        />
        <span className="chip-sep">/</span>
        <FieldChip
          k="Day"
          v={day === "" ? null : dayNames[Number(day)]}
          options={[
            { value: "", label: "Any day" },
            ...dayNames.map((n, i) => ({ value: i, label: n })),
          ]}
          onChange={(v) => setDay(v)}
        />
        <span className="chip-sep">/</span>
        <FieldChip
          k="Time"
          v={time ? formatTime(time) : null}
          options={TIME_OPTIONS}
          onChange={(v) => setTime(v)}
        />
        <div style={{ flex: 1 }} />
        <StampButton variant="primary" onClick={() => handleSearch()} disabled={loading}>
          Search &rsaquo;
        </StampButton>
      </div>
      {loading && <LinearProgress sx={{ mt: 1.5 }} />}

      <div className="split-3" style={{ marginTop: 48 }}>
        <div>
          <Eyebrow>AI suggestions</Eyebrow>
          <h3 style={{ fontFamily: "var(--serif)", fontSize: 28, fontWeight: 500, margin: "8px 0 12px" }}>
            Top <span className="text-accent-rose" style={{ fontWeight: 600 }}>matches</span>
          </h3>
          {matches.length === 0 ? (
            <EmptyState
              title="Search to see tutor matches."
              meta="Try a skill — Math, Physics, Python — or any subject in the catalog."
            />
          ) : (
            matches.map((tutor) => (
              <TutorCard key={tutor.id} tutor={tutor} onView={openTutor} />
            ))
          )}
        </div>

        <div>
          <Eyebrow>Selected tutor</Eyebrow>
          <h3 style={{ fontFamily: "var(--serif)", fontSize: 28, fontWeight: 500, margin: "8px 0 12px" }}>
            {selectedTutor ? selectedTutor.username : (
              <span style={{ color: "var(--mute)", fontWeight: 500, fontStyle: "normal" }}>None yet</span>
            )}
          </h3>

          {!selectedTutor ? (
            <EmptyState
              title="Pick a tutor to inspect availability."
              meta="Their weekly schedule and booking summary will appear here."
            />
          ) : (
            <div className="tprev">
              <div className="tprev-img">
                <img
                  src={selectedTutor.profile_picture_url || `https://picsum.photos/seed/${encodeURIComponent(selectedTutor.username)}-frame/720/600`}
                  alt=""
                  loading="lazy"
                />
              </div>

              <Eyebrow>This week</Eyebrow>
              {availability.length === 0 ? (
                <EmptyState title="No open slots this week." meta="Check back soon or pick another tutor." />
              ) : (
                <>
                  <p className="ux-help" style={{ margin: "0 0 10px" }}>
                    Select a time below, then confirm with <em>Request booking</em> — a click only highlights your choice.
                  </p>
                  <div className="slot-grid" role="group" aria-label="Tutor available times">
                    {availability.map((slot) => {
                      const isSelected = selectedSlot?.id === slot.id;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          className={`slot${isSelected ? " slot--selected" : ""}`}
                          aria-pressed={isSelected}
                          onClick={() => setSelectedSlot(slot)}
                        >
                          <strong>{dayNames[slot.day_of_week]}</strong>
                          {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              <hr className="divider-rule" />
              <div style={{ display: "grid", gap: 8, fontSize: 14, fontFamily: "var(--sans)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--mute)" }}>
                  <span>Subject</span>
                  <span style={{ color: "var(--ink)" }}>{selectedSkill?.name || "Choose a skill above"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--mute)" }}>
                  <span>Format</span>
                  <span style={{ color: "var(--ink)" }}>Online · 1:1</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--mute)" }}>
                  <span>Payment</span>
                  <span style={{ color: "var(--ink)" }}>None until session</span>
                </div>
              </div>

              <StampButton
                variant="accent"
                disabled={!availability.length || !skillId || !selectedSlot || bookingSubmitting}
                onClick={() => requestBooking(selectedSlot)}
              >
                {bookingSubmitting ? "Sending request…" : "Request booking ›"}
              </StampButton>
            </div>
          )}
        </div>
      </div>
    </>
  );

  const bookingsView = (
    <>
      <SectionMarker index={1} label="My bookings" meta={`${bookings.length} record${bookings.length === 1 ? "" : "s"}`} id="bookings" />
      <Tabs
        value={bookingTab}
        onChange={handleBookingTab}
        sx={{ borderBottom: "1px solid var(--rule)", mb: 3 }}
      >
        <Tab value="upcoming" label="Upcoming" />
        <Tab value="pending" label="Pending" />
        <Tab value="past" label="Past" />
      </Tabs>

      {bookings.length === 0 ? (
        <EmptyState title={`No ${bookingTab} bookings.`} meta="Bookings appear here as soon as they exist." />
      ) : (
        bookings.map((b) => (
          <BookingRow
            key={b.id}
            booking={b}
            actions={
              <>
                {b.status !== "completed" && b.status !== "cancelled" && (
                  <StampButton
                    variant="quiet"
                    onClick={() => void onCancelBooking(b.id)}
                  >
                    Cancel
                  </StampButton>
                )}
                {b.status === "completed" && (
                  <StampButton variant="ghost" onClick={() => setReview((r) => ({ ...r, booking_id: b.id }))}>
                    Review
                  </StampButton>
                )}
              </>
            }
          />
        ))
      )}

      {review.booking_id && (
        <div style={{ marginTop: 32 }}>
          <SectionMarker index={2} label="Leave a review" />
          <EdField
            label="Rating (1–5)"
            type="number"
            min={1}
            max={5}
            value={review.rating}
            onChange={(e) => setReview((r) => ({ ...r, rating: e.target.value }))}
          />
          <EdField
            label="Comment"
            type="textarea"
            value={review.comment}
            onChange={(e) => setReview((r) => ({ ...r, comment: e.target.value }))}
          />
          <div style={{ marginTop: 16 }}>
            <StampButton variant="primary" onClick={submitReview}>Submit</StampButton>
          </div>
        </div>
      )}
    </>
  );

  const learningView = (
    <>
      <SectionMarker index={1} label="My learning" meta={`${pastBookings.length} completed`} id="learning" />
      {pastBookings.length === 0 ? (
        <EmptyState title="No completed sessions yet." meta="Once a session wraps it appears here, ready to review." />
      ) : (
        pastBookings.map((b) => (
          <BookingRow
            key={b.id}
            booking={b}
            actions={
              <StampButton variant="ghost" onClick={() => setReview((r) => ({ ...r, booking_id: b.id }))}>
                Review
              </StampButton>
            }
          />
        ))
      )}
    </>
  );

  const profileView = (
    <>
      <SectionMarker index={1} label="Profile" meta="Account" id="profile" />
      <div className="split-2">
        <div>
          <h3 className="ux-card-title">Public profile</h3>
          <p className="ux-help">Shown to tutors you contact. You can keep this short — they care more about the booking than a long bio.</p>
          <p className="ed-field-label" style={{ marginTop: 8 }}>Profile photo</p>
          <ProfilePhotoUpload
            currentUrl={user?.profile_picture_url}
            onUpload={uploadAvatar}
          />
          <EdField label="Username" value={profileForm.username}
            onChange={(e) => setProfileForm((p) => ({ ...p, username: e.target.value }))} />
          <EdField label="Bio" type="textarea" rows={4} value={profileForm.bio}
            onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))} />
          <div style={{ marginTop: 24 }}>
            <StampButton variant="primary" onClick={saveProfile}>Save profile</StampButton>
          </div>
          <hr className="divider-rule" style={{ margin: "32px 0" }} />
          <h3 className="ux-card-title">Sign-in</h3>
          <p className="ux-help">Update your password here. You will need your current password.</p>
          <EdField
            label="Current password"
            type="password"
            autoComplete="current-password"
            value={passwordForm.old_password}
            onChange={(e) => setPasswordForm((p) => ({ ...p, old_password: e.target.value }))}
          />
          <EdField
            label="New password"
            type="password"
            autoComplete="new-password"
            value={passwordForm.new_password}
            onChange={(e) => setPasswordForm((p) => ({ ...p, new_password: e.target.value }))}
          />
          <div style={{ marginTop: 20 }}>
            <StampButton variant="ghost" onClick={savePassword}>Update password</StampButton>
          </div>
        </div>
        <aside className="marg">
          <div className="marg-row"><span className="k">Email</span><span className="v" style={{ fontSize: 18 }}>{user?.email || "—"}</span></div>
          <div className="marg-row"><span className="k">Role</span><span className="v">Student</span></div>
          <div className="marg-row"><span className="k">Pending requests</span><span className="v numeric">{pendingForBadge}</span></div>
          <div className="marg-row"><span className="k">Sessions</span><span className="v numeric">{pastBookings.length}</span></div>
        </aside>
      </div>
    </>
  );

  const notificationsView = (
    <>
      <SectionMarker index={1} label="Notifications" meta="From your bookings" id="notifications" />
      <div className="stat-grid-3">
        <StatBlock value={pendingForBadge} label="Awaiting response" italic />
        <StatBlock value={bookings.length} label="Bookings in this tab" />
        <StatBlock value={pastBookings.length} label="Completed" />
      </div>
      <p className="ux-help" style={{ marginTop: 24, maxWidth: "52ch" }}>
        The header bell shows how many <strong>pending</strong> booking requests need your or the tutor&rsquo;s action.
      </p>
    </>
  );

  const supportView = (
    <>
      <SectionMarker index={1} label="Support" meta="We reply by email" id="support" />
      <div className="ux-support-card">
        <p>Describe what went wrong, which booking it concerns, and a good time to reach you. We tie replies to the email on your account.</p>
        <StampButton
          variant="primary"
          as="a"
          href={`mailto:support@yt2utor.local?subject=YT2UTOR support&body=Account: ${encodeURIComponent(user?.email || "")}`}
        >
          Email support
        </StampButton>
      </div>
    </>
  );

  const views = {
    dashboard: dashboardView,
    find: findView,
    bookings: bookingsView,
    learning: learningView,
    profile: profileView,
    notifications: notificationsView,
    support: supportView,
  };

  return (
    <>
      {views[activeSection] || dashboardView}
    </>
  );
}

function BookingRow({ booking, actions }) {
  const date = booking.booking_date ? new Date(`${booking.booking_date}T00:00:00`) : null;
  const day = date ? date.getDate() : "—";
  const month = date ? date.toLocaleString("en", { month: "short" }).toUpperCase() : "";
  return (
    <div className="brow">
      <div className="brow-date">
        {day}
        <small>{month}</small>
      </div>
      <div>
        <div className="brow-title">{booking.skill_name || "Tutoring session"}</div>
        <div className="brow-meta">
          {formatDate(booking.booking_date)} · {formatTime(booking.start_time)} – {formatTime(booking.end_time)}
          {booking.tutor_email && ` · ${booking.tutor_email}`}
        </div>
      </div>
      <InkPill status={booking.status} />
      {actions}
    </div>
  );
}
