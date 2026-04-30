import React, { useEffect, useMemo, useState } from "react";
import { Chip, FormControl, InputLabel, Select, MenuItem, Tabs, Tab } from "@mui/material";
import {
  completeBooking,
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
import { useAuth } from "../../context/AuthContext";
import { useFeedback } from "../../context/FeedbackContext";
import {
  asArray,
  dayNames,
  defaultWeekStart,
  formatDate,
  formatSessionDuration,
  formatTime,
  getErrorMessage,
  isInSameCalendarWeekAsToday,
  isPastSessionEnd,
} from "../../utils/workspace";
import {
  DocumentUploadField,
  EdField,
  EmptyState,
  Eyebrow,
  Hero,
  InkPill,
  ProfilePhotoUpload,
  SectionMarker,
  StampButton,
  StatBlock,
} from "../../components/editorial";

export default function TutorWorkspace({ skills, activeSection = "dashboard", onNotificationCountChange }) {
  const { user, updateProfile, uploadAvatar, changePassword } = useAuth();
  const { notify, confirm } = useFeedback();
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [confirmedBookings, setConfirmedBookings] = useState([]);
  const [pastBookings, setPastBookings] = useState([]);
  const [profile, setProfile] = useState(null);
  const [slot, setSlot] = useState({
    week_start_date: defaultWeekStart,
    day_of_week: 0,
    start_time: "09:00",
    end_time: "10:00",
  });
  const [qualification, setQualification] = useState({ skill_id: "", file: null });
  const [profileForm, setProfileForm] = useState({
    username: user?.username || "",
    bio: user?.bio || "",
  });
  const [passwordForm, setPasswordForm] = useState({ old_password: "", new_password: "" });
  const [sessionsTab, setSessionsTab] = useState("upcoming");
  const [sessionActionId, setSessionActionId] = useState(null);

  const selectedSkillObjects = useMemo(
    () => selectedSkills.map((id) => skills.find((s) => s.id === Number(id))).filter(Boolean),
    [selectedSkills, skills],
  );

  const sessionMetrics = useMemo(() => {
    const up = asArray(confirmedBookings);
    const past = asArray(pastBookings);
    const thisWeek = up.filter((b) => b.booking_date && isInSameCalendarWeekAsToday(b.booking_date));
    return {
      next: up[0] || null,
      thisWeekCount: thisWeek.length,
      upcomingCount: up.length,
      pastCount: past.length,
    };
  }, [confirmedBookings, pastBookings]);

  useEffect(() => {
    setProfileForm({
      username: user?.username || "",
      bio: user?.bio || "",
    });
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = async () => {
    if (!user?.id) return;
    const [profileData, slotData, pendingData, confirmedData, pastData] = await Promise.all([
      fetchTutorProfile(user.id),
      fetchTutorAvailability(user.id),
      fetchBookings({ type: "pending" }),
      fetchBookings({ type: "upcoming" }),
      fetchBookings({ type: "past" }),
    ]);
    setProfile(profileData);
    setSelectedSkills(asArray(profileData.skills).map((s) => s.id));
    setAvailability(asArray(slotData));
    const pendingRows = asArray(pendingData);
    setBookings(pendingRows);
    setConfirmedBookings(asArray(confirmedData));
    setPastBookings(asArray(pastData));
    onNotificationCountChange?.(pendingRows.length);
  };

  useEffect(() => {
    if (!user?.id) return;
    refresh().catch(() => { onNotificationCountChange?.(0); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const saveProfile = async () => {
    try {
      await updateProfile(profileForm);
      notify.success("Profile updated.");
      await refresh();
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

  const saveSkills = async () => {
    try {
      await updateTutorSkills(selectedSkills.map(Number));
      notify.success("Skills updated.");
      await refresh();
    } catch (err) {
      notify.error(getErrorMessage(err, "Could not update skills."));
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
      notify.success("Availability saved.");
      await refresh();
    } catch (err) {
      notify.error(getErrorMessage(err, "Could not save availability."));
    }
  };

  const submitQualification = async () => {
    if (!qualification.skill_id || !qualification.file) {
      notify.warning("Choose a skill and file first.");
      return;
    }
    try {
      const fd = new FormData();
      fd.append("skill_id", qualification.skill_id);
      fd.append("file", qualification.file);
      await uploadQualification(fd);
      notify.success("Qualification uploaded for review.");
      setQualification({ skill_id: "", file: null });
      await refresh();
    } catch (err) {
      notify.error(getErrorMessage(err, "Could not upload qualification."));
    }
  };

  const updateBooking = async (booking, action) => {
    if (action === "reject") {
      const ok = await confirm({
        title: "Reject this request?",
        description: "The student will be notified. You can still receive new requests.",
        confirmLabel: "Reject request",
        cancelLabel: "Go back",
        danger: true,
      });
      if (!ok) return;
    }
    try {
      if (action === "confirm") await confirmBooking(booking.id);
      if (action === "reject") await rejectBooking(booking.id);
      notify.success("Booking updated.");
      await refresh();
    } catch (err) {
      notify.error(getErrorMessage(err, "Could not update booking."));
    }
  };

  const removeQualification = async (id) => {
    const ok = await confirm({
      title: "Remove this document?",
      description: "The file will be removed from your profile. You can upload a new one later.",
      confirmLabel: "Remove",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteQualification(id);
      notify.success("Qualification removed.");
      await refresh();
    } catch (err) {
      notify.error(getErrorMessage(err, "Could not remove qualification."));
    }
  };

  const removeAvailability = async (id) => {
    const ok = await confirm({
      title: "Remove this time slot?",
      description: "Students will no longer be able to book this slot for new sessions.",
      confirmLabel: "Remove slot",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteAvailability(id);
      notify.success("Time slot removed.");
      await refresh();
    } catch (err) {
      notify.error(getErrorMessage(err, "Could not remove slot."));
    }
  };

  const onMarkSessionComplete = async (booking) => {
    if (!isPastSessionEnd(booking)) {
      notify.warning("You can mark a session complete only after it has ended.");
      return;
    }
    setSessionActionId(booking.id);
    try {
      await completeBooking(booking.id);
      notify.success("Session marked complete.");
      await refresh();
    } catch (err) {
      notify.error(getErrorMessage(err, "Could not mark session complete."));
    } finally {
      setSessionActionId(null);
    }
  };

  const heroNode = (
    <Hero
      eyebrow="Tutor studio"
      title={["Run your studio with ", { em: "clarity" }, "."]}
      sub="Publish skills, upload credentials, shape your weekly capacity, and respond to booking requests with operational context at hand."
      actions={[
        <StampButton key="skills" variant="primary" onClick={() => window.location.assign("/tutor#skills")}>
          Manage skills &rsaquo;
        </StampButton>,
        <StampButton key="req" variant="ghost" onClick={() => window.location.assign("/tutor#requests")}>
          Booking queue
        </StampButton>,
      ]}
      marginalia={[
        { k: "Pending requests", v: bookings.length },
        { k: "Skills published", v: selectedSkillObjects.length },
        { k: "Average rating", v: profile?.average_rating || "New", suffix: profile?.total_reviews ? `· ${profile.total_reviews}` : null, numeric: false },
      ]}
    />
  );

  const dashboardView = (
    <>
      {heroNode}
      <SectionMarker index={1} label="At a glance" meta="Today" id="dashboard" />
      <div className="stat-grid-3">
        <StatBlock value={bookings.length} label="Pending requests" italic />
        <StatBlock value={confirmedBookings.length} label="Upcoming sessions" />
        <StatBlock value={pastBookings.length} label="Completed sessions" />
      </div>

      <SectionMarker index={2} label="Latest requests" meta={`${bookings.length} awaiting response`} />
      {bookings.length === 0 ? (
        <EmptyState title="Inbox at zero." meta="Booking requests appear here as soon as students reserve a slot." />
      ) : (
        bookings.slice(0, 4).map((b) => (
          <RequestRow
            key={b.id}
            booking={b}
            onConfirm={() => updateBooking(b, "confirm")}
            onReject={() => updateBooking(b, "reject")}
          />
        ))
      )}
    </>
  );

  const skillsView = (
    <>
      <SectionMarker index={1} label="Skills & proof" meta={`${selectedSkillObjects.length} subjects`} id="skills" />

      <Eyebrow>Teaching subjects</Eyebrow>
      <div className="tutor-skills-pick" style={{ marginTop: 12 }}>
        <FormControl variant="standard" fullWidth sx={{ minWidth: 0, maxWidth: "100%" }}>
          <InputLabel>Pick the subjects you teach</InputLabel>
          <Select
            multiple
            value={selectedSkills}
            onChange={(e) => setSelectedSkills(e.target.value)}
            renderValue={() => selectedSkillObjects.map((s) => s.name).join(", ")}
          >
            {skills.map((s) => (
              <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <div className="row-flex tutor-skill-chips" style={{ marginTop: 16 }}>
          {selectedSkillObjects.map((s) => (
            <Chip key={s.id} label={s.name} variant="outlined"
              sx={{ borderColor: "var(--lilac-deep)", color: "var(--lilac-deep)", fontFamily: "var(--sans)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", fontSize: 11 }} />
          ))}
          {!selectedSkillObjects.length && <span style={{ color: "var(--mute)", fontStyle: "normal", fontWeight: 500, fontFamily: "var(--serif)" }}>Choose at least one subject.</span>}
        </div>
        <div style={{ marginTop: 24 }}>
          <StampButton variant="primary" onClick={saveSkills}>Save skills</StampButton>
        </div>
      </div>

      <SectionMarker index={2} label="Qualifications" meta={`${asArray(profile?.qualifications).length} on file`} />
      <div className="split-2 split-2--qual" style={{ alignItems: "start" }}>
        <div className="min-w-0">
          <EdField
            label="Subject for this proof"
            type="select"
            value={qualification.skill_id}
            onChange={(e) => setQualification((q) => ({ ...q, skill_id: e.target.value }))}
            options={[{ value: "", label: "Choose subject" }, ...skills.map((s) => ({ value: s.id, label: s.name }))]}
          />
          <DocumentUploadField
            label="Document (PDF, JPG, PNG)"
            accept=".pdf,.jpg,.jpeg,.png"
            file={qualification.file}
            onChange={(e) => setQualification((q) => ({ ...q, file: e.target.files?.[0] || null }))}
            emptyHint="No file selected"
            hint="Up to 5 MB. Reviewed by an admin before your proof is approved."
          />
          <div style={{ marginTop: 16 }}>
            <StampButton variant="accent" onClick={submitQualification}>Submit for review</StampButton>
          </div>
        </div>
        <div className="min-w-0">
          {asArray(profile?.qualifications).length === 0 ? (
            <EmptyState title="No qualifications uploaded yet." meta="Add proof to unlock approved teaching subjects." />
          ) : (
            asArray(profile?.qualifications).map((item) => (
              <div className="erow" key={item.id}>
                <div>
                  <div className="erow-title">{item.file_name}</div>
                  <div className="erow-meta">{item.skill?.name || "—"}</div>
                </div>
                <InkPill status={item.status} />
                <StampButton variant="quiet" onClick={() => void removeQualification(item.id)}>
                  Remove
                </StampButton>
              </div>
            ))
          )}
        </div>
      </div>

      <SectionMarker index={3} label="Weekly availability" meta={`${availability.length} slot${availability.length === 1 ? "" : "s"}`} />
      <div className="split-2">
        <div>
          <EdField label="Week starts" type="date" value={slot.week_start_date}
            onChange={(e) => setSlot((s) => ({ ...s, week_start_date: e.target.value }))} />
          <EdField label="Day" type="select" value={slot.day_of_week}
            onChange={(e) => setSlot((s) => ({ ...s, day_of_week: e.target.value }))}
            options={dayNames.map((n, i) => ({ value: i, label: n }))} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <EdField label="Start" type="time" value={slot.start_time}
              onChange={(e) => setSlot((s) => ({ ...s, start_time: e.target.value }))} />
            <EdField label="End" type="time" value={slot.end_time}
              onChange={(e) => setSlot((s) => ({ ...s, end_time: e.target.value }))} />
          </div>
          <div style={{ marginTop: 16 }}>
            <StampButton variant="primary" onClick={saveAvailability}>Add slot</StampButton>
          </div>
        </div>
        <div>
          {availability.length === 0 ? (
            <EmptyState title="Calendar is empty." meta="Publish a slot to start receiving requests." />
          ) : (
            availability.map((item) => (
              <div className="erow" key={item.id}>
                <div>
                  <div className="erow-title" style={{ fontStyle: "normal", fontWeight: 600, color: "var(--rose-deep)" }}>{dayNames[item.day_of_week]}</div>
                  <div className="erow-meta">{formatTime(item.start_time)} – {formatTime(item.end_time)}</div>
                </div>
                <span style={{ width: 1 }} />
                <StampButton variant="quiet" onClick={() => void removeAvailability(item.id)}>
                  Remove
                </StampButton>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );

  const requestsView = (
    <>
      <SectionMarker index={1} label="Requests" meta={`${bookings.length} pending`} id="requests" />
      {bookings.length === 0 ? (
        <EmptyState title="No requests waiting." meta="When a student reserves a slot, you can confirm or reject it here." />
      ) : (
        bookings.map((b) => (
          <RequestRow
            key={b.id}
            booking={b}
            onConfirm={() => updateBooking(b, "confirm")}
            onReject={() => updateBooking(b, "reject")}
          />
        ))
      )}
    </>
  );

  const nextSessionLabel = sessionMetrics.next
    ? `${formatDate(sessionMetrics.next.booking_date)} · ${formatTime(sessionMetrics.next.start_time)}`
    : "—";
  const durationExample = sessionMetrics.next
    ? formatSessionDuration(sessionMetrics.next.start_time, sessionMetrics.next.end_time)
    : "";

  const earningsView = (
    <>
      <SectionMarker
        index={1}
        label="Sessions & calendar"
        meta={`${sessionMetrics.upcomingCount} upcoming · ${sessionMetrics.pastCount} in history`}
        id="earnings"
      />
      <div className="sessions-hero">
        <Eyebrow>Your schedule</Eyebrow>
        <h2
          className="sessions-hero__title"
          style={{
            fontFamily: "var(--serif)",
            fontSize: "clamp(32px, 4vw, 48px)",
            fontWeight: 500,
            lineHeight: 1.08,
            margin: "8px 0 12px",
          }}
        >
          Teach with <span className="text-accent-rose" style={{ fontWeight: 600 }}>continuity</span>
        </h2>
        <p className="ux-help" style={{ maxWidth: "56ch" }}>
          See who you are working with, when the slot was first requested, and mark sessions done after they end. History stays below for your records.
        </p>
        <div className="marg" style={{ marginTop: 28, maxWidth: 520 }}>
          <div className="marg-row">
            <span className="k">Next session</span>
            <span className="v" style={{ fontSize: 17 }}>{nextSessionLabel}</span>
          </div>
          {sessionMetrics.next && durationExample && (
            <div className="marg-row">
              <span className="k">Block length</span>
              <span className="v">{durationExample}</span>
            </div>
          )}
          <div className="marg-row">
            <span className="k">This week</span>
            <span className="v numeric">{sessionMetrics.thisWeekCount} scheduled</span>
          </div>
        </div>
      </div>

      <div className="stat-grid-3" style={{ marginTop: 32 }}>
        <StatBlock
          value={sessionMetrics.next ? formatDate(sessionMetrics.next.booking_date) : "—"}
          label="Next on calendar"
          italic
        />
        <StatBlock value={sessionMetrics.thisWeekCount} label="Sessions this week" />
        <StatBlock value={sessionMetrics.pastCount} label="Completed (all time)" />
      </div>
      <div className="stat-grid-3" style={{ marginTop: 0 }}>
        <StatBlock value={sessionMetrics.upcomingCount} label="Upcoming (confirmed)" italic />
        <StatBlock value={bookings.length} label="Pending requests" />
        <StatBlock value={profile?.verified ? "Verified" : "Pending"} label="Tutor check" />
      </div>

      <Tabs
        value={sessionsTab}
        onChange={(_, v) => setSessionsTab(v)}
        sx={{ borderBottom: "1px solid var(--rule)", mt: 4, mb: 2 }}
      >
        <Tab value="upcoming" label={`Upcoming (${sessionMetrics.upcomingCount})`} />
        <Tab value="history" label={`History (${sessionMetrics.pastCount})`} />
      </Tabs>

      {sessionsTab === "upcoming" && (
        <div>
          {asArray(confirmedBookings).length === 0 ? (
            <EmptyState
              title="No confirmed sessions on the calendar."
              meta="When you confirm a request, it shows up here. Pending requests live under Requests in the nav."
              action={(
                <StampButton variant="primary" onClick={() => window.location.assign("/tutor#requests")}>
                  Open request queue
                </StampButton>
              )}
            />
          ) : (
            <ul className="session-list" style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {asArray(confirmedBookings).map((b) => (
                <li key={b.id} className="session-list__item">
                  <TutorSessionRow
                    booking={b}
                    showMarkComplete
                    markBusy={sessionActionId === b.id}
                    canComplete={b.status === "confirmed" && isPastSessionEnd(b)}
                    onMarkComplete={() => void onMarkSessionComplete(b)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {sessionsTab === "history" && (
        <div>
          {asArray(pastBookings).length === 0 ? (
            <EmptyState
              title="No completed sessions yet."
              meta="When you mark a 1:1 as complete (after it ends), it appears here for your records."
            />
          ) : (
            <ul className="session-list" style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {asArray(pastBookings).map((b) => (
                <li key={b.id} className="session-list__item">
                  <TutorSessionRow booking={b} showMarkComplete={false} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );

  const reviewsView = (
    <>
      <SectionMarker index={1} label="Reviews" meta="On your tutor profile" id="reviews" />
      <div className="stat-grid-3">
        <StatBlock value={profile?.average_rating || "New"} label="Average rating" italic />
        <StatBlock value={profile?.total_reviews || 0} label="Total reviews" />
        <StatBlock value={confirmedBookings.length + pastBookings.length} label="Sessions to date" />
      </div>
    </>
  );

  const notificationsView = (
    <>
      <SectionMarker index={1} label="Notifications" meta="Request queue" id="notifications" />
      <div className="stat-grid-3">
        <StatBlock value={bookings.length} label="Need your response" italic />
        <StatBlock value={confirmedBookings.length} label="Upcoming" />
        <StatBlock value={pastBookings.length} label="Completed" />
      </div>
      <p className="ux-help" style={{ marginTop: 24, maxWidth: "52ch" }}>
        The bell in the header matches <strong>pending</strong> student requests waiting for confirm or reject.
      </p>
    </>
  );

  const supportView = (
    <>
      <SectionMarker index={1} label="Support" meta="Tutor" id="support" />
      <div className="ux-support-card">
        <p>For profile issues, payments, or bugs, email us with your account address in the message.</p>
        <StampButton
          variant="primary"
          as="a"
          href={`mailto:support@yt2utor.local?subject=YT2UTOR tutor support&body=Account: ${encodeURIComponent(user?.email || "")}`}
        >
          Email support
        </StampButton>
      </div>
    </>
  );

  const profileView = (
    <>
      <SectionMarker index={1} label="Profile" meta="Account" id="profile" />
      <div className="split-2">
        <div>
          <h3 className="ux-card-title">Public tutor profile</h3>
          <p className="ux-help">How you appear in search, on your detail page, and in the header.</p>
          <p className="ed-field-label" style={{ marginTop: 8 }}>Profile photo</p>
          <ProfilePhotoUpload
            currentUrl={user?.profile_picture_url}
            onUpload={uploadAvatar}
          />
          <EdField
            label="Username"
            value={profileForm.username}
            onChange={(e) => setProfileForm((p) => ({ ...p, username: e.target.value }))}
          />
          <EdField
            label="Bio"
            type="textarea"
            rows={4}
            value={profileForm.bio}
            onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))}
          />
          <div style={{ marginTop: 20 }}>
            <StampButton variant="primary" onClick={saveProfile}>Save profile</StampButton>
          </div>
          <hr className="divider-rule" style={{ margin: "32px 0" }} />
          <h3 className="ux-card-title">Password</h3>
          <p className="ux-help">Update your sign-in password.</p>
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
          <div className="marg-row"><span className="k">Role</span><span className="v">Tutor</span></div>
        </aside>
      </div>
    </>
  );

  const views = {
    dashboard: dashboardView,
    skills: skillsView,
    requests: requestsView,
    earnings: earningsView,
    reviews: reviewsView,
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

function TutorSessionRow({
  booking,
  showMarkComplete = false,
  onMarkComplete,
  canComplete = false,
  markBusy = false,
}) {
  const d = booking.booking_date
    ? new Date(`${booking.booking_date}T12:00:00`)
    : null;
  const who = booking.student_username
    || (booking.student_email && booking.student_email.split("@")[0])
    || "Student";
  const duration = formatSessionDuration(booking.start_time, booking.end_time);
  let requestLine = null;
  if (booking.request_date) {
    const r = new Date(booking.request_date);
    if (!Number.isNaN(r.getTime())) {
      requestLine = `Requested ${r.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })}`;
    }
  }
  let endLine = null;
  if (booking.status === "completed" && booking.updated_at) {
    const c = new Date(booking.updated_at);
    if (!Number.isNaN(c.getTime())) {
      endLine = `Completed (recorded ${c.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })})`;
    }
  }
  return (
    <div className="brow session-row">
      <div className="brow-date">
        {d ? d.getDate() : "—"}
        <small>
          {d
            ? d.toLocaleString("en", { month: "short" }).toUpperCase()
            : ""}
        </small>
      </div>
      <div className="session-row__body">
        <div className="brow-title">
          {booking.skill_name || "Tutoring session"} · {who}
        </div>
        <div className="brow-meta">
          {formatDate(booking.booking_date)} · {formatTime(booking.start_time)} – {formatTime(booking.end_time)}
          {duration && ` · ${duration}`}
        </div>
        {booking.student_email && (
          <a className="session-row__mail" href={`mailto:${encodeURIComponent(booking.student_email)}`}>
            {booking.student_email}
          </a>
        )}
        {requestLine && <p className="session-row__sub">{requestLine}</p>}
        {endLine && <p className="session-row__sub session-row__sub--muted">{endLine}</p>}
        {!isPastSessionEnd(booking) && booking.status === "confirmed" && (
          <p className="session-row__sub session-row__sub--muted">Mark complete unlocks after the session end time.</p>
        )}
      </div>
      <InkPill status={booking.status} />
      <div className="row-flex session-row__cta">
        {showMarkComplete && booking.status === "confirmed" && (
          <StampButton
            type="button"
            variant="accent"
            onClick={onMarkComplete}
            disabled={!canComplete || markBusy}
          >
            {markBusy ? "Saving…" : "Mark complete"}
          </StampButton>
        )}
      </div>
    </div>
  );
}

function RequestRow({ booking, onConfirm, onReject }) {
  return (
    <div className="brow">
      <div className="brow-date">
        {booking.booking_date ? new Date(`${booking.booking_date}T00:00:00`).getDate() : "—"}
        <small>{booking.booking_date ? new Date(`${booking.booking_date}T00:00:00`).toLocaleString("en", { month: "short" }).toUpperCase() : ""}</small>
      </div>
      <div>
        <div className="brow-title">{booking.skill_name || "Tutoring session"}</div>
        <div className="brow-meta">
          {formatDate(booking.booking_date)} · {formatTime(booking.start_time)} – {formatTime(booking.end_time)}
          {booking.student_email && ` · ${booking.student_email}`}
        </div>
      </div>
      <InkPill status={booking.status} />
      <div className="row-flex">
        <StampButton variant="primary" onClick={onConfirm}>Confirm</StampButton>
        <StampButton variant="quiet" onClick={onReject}>Reject</StampButton>
      </div>
    </div>
  );
}
