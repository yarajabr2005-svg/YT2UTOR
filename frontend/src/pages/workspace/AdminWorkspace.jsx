import React, { useEffect, useMemo, useState } from "react";
import { Avatar } from "@mui/material";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import { fetchPendingQualifications, verifyQualification } from "../../api/learning";
import { useAuth } from "../../context/AuthContext";
import { useFeedback } from "../../context/FeedbackContext";
import { asArray, formatDate, getErrorMessage } from "../../utils/workspace";
import {
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

function QualificationPreview({ item }) {
  const fileUrl = item?.file_url || "";
  const fileName = item?.file_name || "Uploaded qualification";
  const ext = fileName.split(".").pop()?.toLowerCase();
  const isImage = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext);
  const isPdf = ext === "pdf";
  if (isImage && fileUrl) {
    return <div className="doc-prev"><img src={fileUrl} alt={fileName} loading="lazy" /></div>;
  }
  if (isPdf && fileUrl) {
    return <div className="doc-prev"><iframe src={fileUrl} title={fileName} /></div>;
  }
  return (
    <div className="doc-prev">
      <InsertDriveFileRoundedIcon sx={{ fontSize: 56, color: "var(--rose)" }} />
      <div style={{ marginTop: 12, fontFamily: "var(--serif)", fontStyle: "normal", fontWeight: 500, color: "var(--rose-deep)" }}>{fileName}</div>
      <div style={{ fontSize: 13, color: "var(--mute)" }}>Open the uploaded file to view the original document.</div>
    </div>
  );
}

export default function AdminWorkspace({ activeSection = "dashboard", onNotificationCountChange }) {
  const { user, updateProfile, uploadAvatar, changePassword } = useAuth();
  const { notify, confirm } = useFeedback();
  const [qualifications, setQualifications] = useState([]);
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState("");
  const [query, setQuery] = useState("");
  const [profileForm, setProfileForm] = useState({
    username: user?.username || "",
    bio: user?.bio || "",
  });
  const [passwordForm, setPasswordForm] = useState({ old_password: "", new_password: "" });

  const load = async () => {
    const data = await fetchPendingQualifications();
    const rows = asArray(data);
    setQualifications(rows);
    setSelected((cur) => rows.find((r) => r.id === cur?.id) || rows[0] || null);
    onNotificationCountChange?.(rows.length);
  };

  useEffect(() => {
    load().catch(() => {
      setQualifications([]);
      onNotificationCountChange?.(0);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setProfileForm({
      username: user?.username || "",
      bio: user?.bio || "",
    });
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const review = async (status) => {
    if (!selected) return;
    if (status === "rejected") {
      const ok = await confirm({
        title: "Reject this qualification?",
        description: "The tutor can upload new proof. This decision is visible in their history.",
        confirmLabel: "Reject",
        danger: true,
      });
      if (!ok) return;
    }
    try {
      await verifyQualification(selected.id, { status, notes });
      notify.success(`Qualification ${status}.`);
      setNotes("");
      await load();
    } catch (err) {
      notify.error(getErrorMessage(err, "Could not review qualification."));
    }
  };

  const filtered = useMemo(
    () => qualifications.filter((item) => {
      const haystack = `${item.file_name} ${item.skill?.name || ""} ${item.tutor_id}`.toLowerCase();
      return haystack.includes(query.toLowerCase());
    }),
    [qualifications, query],
  );

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

  const heroNode = (
    <Hero
      eyebrow="Admin desk"
      title={["Review tutor evidence with ", { em: "rigor" }, "."]}
      sub="Move through pending uploads, inspect files, record notes, and keep the platform quality loop visible at every step."
      actions={[
        <StampButton key="rev" variant="primary" onClick={() => window.location.assign("/admin#review")}>
          Open review queue &rsaquo;
        </StampButton>,
        <StampButton key="rep" variant="ghost" onClick={() => window.location.assign("/admin#reports")}>
          Reports
        </StampButton>,
      ]}
      marginalia={[
        { k: "Pending uploads", v: qualifications.length },
        { k: "After filter", v: filtered.length },
        { k: "Selection", v: selected ? "Open" : "Empty", numeric: false },
      ]}
    />
  );

  const dashboardView = (
    <>
      {heroNode}
      <SectionMarker index={1} label="Queue summary" meta="Right now" id="dashboard" />
      <div className="stat-grid-3">
        <StatBlock value={qualifications.length} label="Pending uploads" italic />
        <StatBlock value={qualifications.filter((q) => q.file_url).length} label="Files attached" />
        <StatBlock value={qualifications.filter((q) => q.notes).length} label="With reviewer notes" />
      </div>
    </>
  );

  const reviewView = (
    <>
      <SectionMarker index={1} label="Pending qualifications" meta={`${filtered.length} item${filtered.length === 1 ? "" : "s"}`} id="review" />

      <div className="split-3" style={{ alignItems: "start" }}>
        <div>
          <EdField
            label="Filter by tutor or skill"
            placeholder="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div style={{ marginTop: 16 }}>
            {filtered.length === 0 ? (
              <EmptyState title="Queue is clear." meta="No pending qualifications match your filter." />
            ) : (
              filtered.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`queue-item ${selected?.id === item.id ? "is-selected" : ""}`}
                  onClick={() => setSelected(item)}
                >
                  <Avatar
                    className="queue-item-avatar"
                    sx={{ width: 36, height: 36, fontSize: 13, flexShrink: 0 }}
                  >
                    {String(item.tutor_id).slice(0, 1).toUpperCase()}
                  </Avatar>
                  <div className="queue-item-body">
                    <div className="queue-item-name">{item.skill?.name || "Qualification"}</div>
                    <div
                      className="queue-item-filename"
                      title={item.file_name || undefined}
                    >
                      {item.file_name || "—"}
                    </div>
                    <div className="queue-item-meta-row">
                      <span className="queue-item-date">
                        {formatDate(item.uploaded_at?.slice(0, 10))}
                      </span>
                      <span className="queue-item-pill">
                        <InkPill status="pending" />
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div>
          {!selected ? (
            <EmptyState title="Select an upload to review." meta="The right column shows file preview and decision controls." />
          ) : (
            <div>
              <Eyebrow>{selected.tutor_id}</Eyebrow>
              <h3 style={{ fontFamily: "var(--serif)", fontSize: 36, fontWeight: 500, margin: "8px 0 4px", lineHeight: 1.05 }}>
                {selected.skill?.name || "Tutor qualification"}
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <InkPill status="pending" />
                <span style={{ fontFamily: "var(--sans)", color: "var(--mute)", fontSize: 13 }}>
                  Uploaded {formatDate(selected.uploaded_at?.slice(0, 10))}
                </span>
              </div>

              <div className="erow">
                <div>
                  <div className="erow-title">{selected.file_name}</div>
                  <div className="erow-meta">
                    {selected.file_size ? `${Math.round(selected.file_size / 1024)} KB` : "Uploaded file"}
                  </div>
                </div>
                <span />
                <StampButton variant="ghost" as="a" href={selected.file_url} target="_blank" rel="noreferrer">
                  <DownloadRoundedIcon sx={{ fontSize: 14, marginRight: 0.5 }} /> Open
                </StampButton>
              </div>

              <div style={{ marginTop: 24 }}>
                <QualificationPreview item={selected} />
              </div>

              <div style={{ marginTop: 32 }}>
                <EdField
                  label="Review notes"
                  type="textarea"
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes on this qualification."
                />
              </div>

              <div className="row-flex" style={{ marginTop: 24, justifyContent: "flex-end" }}>
                <StampButton variant="quiet" onClick={() => review("rejected")}>Reject</StampButton>
                <StampButton variant="primary" onClick={() => review("approved")}>Approve &rsaquo;</StampButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );

  const reportsView = (
    <>
      <SectionMarker index={1} label="Reports" meta="Backend-derived" id="reports" />
      <div className="stat-grid-3">
        <StatBlock value={qualifications.length} label="Awaiting action" italic />
        <StatBlock value={qualifications.filter((q) => q.file_url).length} label="Files attached" />
        <StatBlock value={qualifications.filter((q) => q.notes).length} label="With notes" />
      </div>
    </>
  );

  const accountView = (
    <>
      <SectionMarker index={1} label="Account" meta="Your admin login" id="account" />
      <div className="split-2">
        <div>
          <h3 className="ux-card-title">Profile</h3>
          <p className="ux-help">Username, bio, and a profile photo shown in the app header. Email is not editable here.</p>
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
            rows={3}
            value={profileForm.bio}
            onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))}
          />
          <div style={{ marginTop: 20 }}>
            <StampButton variant="primary" onClick={saveProfile}>Save profile</StampButton>
          </div>
          <hr className="divider-rule" style={{ margin: "32px 0" }} />
          <h3 className="ux-card-title">Password</h3>
          <p className="ux-help">Use a strong password for this account.</p>
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
          <div className="marg-row"><span className="k">Role</span><span className="v">Admin</span></div>
        </aside>
      </div>
    </>
  );

  const tutorsView = reviewView; // alias — same panel

  const notificationsView = (
    <>
      <SectionMarker index={1} label="Notifications" meta="Queue" id="notifications" />
      {qualifications.length > 0 ? (
        <ul className="ux-list-plain">
          <li>
            <strong>{qualifications.length}</strong> qualification file{qualifications.length === 1 ? "" : "s"} waiting in the review queue.
            <button type="button" className="ux-inline-link" onClick={() => window.location.assign("/admin#review")}>
              Open review
            </button>
          </li>
        </ul>
      ) : (
        <p className="ux-help">The queue is clear. When tutors upload new proof, the count appears here and in the top bar.</p>
      )}
    </>
  );

  const supportView = (
    <>
      <SectionMarker index={1} label="Support" meta="Internal" id="support" />
      <div className="ux-support-card">
        <p>Platform, billing, or access issues: email us from your registered address so we can find your admin record.</p>
        <StampButton variant="primary" as="a" href="mailto:support@yt2utor.local?subject=YT2UTOR admin support">
          Email support
        </StampButton>
      </div>
    </>
  );

  const views = {
    dashboard: dashboardView,
    review: reviewView,
    tutors: tutorsView,
    reports: reportsView,
    account: accountView,
    settings: accountView,
    notifications: notificationsView,
    support: supportView,
  };

  return (
    <>
      {views[activeSection] || dashboardView}
    </>
  );
}
