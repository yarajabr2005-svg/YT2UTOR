import React from "react";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import StampButton from "./StampButton";

function seedFor(value) {
  return encodeURIComponent(String(value || "yt2utor").toLowerCase().replace(/\s+/g, "-"));
}

export default function TutorCard({ tutor, onView, action = "View profile", reason }) {
  const seed = seedFor(tutor?.username || tutor?.id);
  const skills = Array.isArray(tutor?.skills) ? tutor.skills.slice(0, 4) : [];
  return (
    <article className="tcard">
      <div className="tcard-img">
        <img
          src={tutor?.profile_picture_url || `https://picsum.photos/seed/${seed}-portrait/520/640`}
          alt=""
          loading="lazy"
        />
      </div>
      <div>
        <h3 className="tcard-name">{tutor?.username}</h3>
        <div className="tcard-meta">
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <StarRoundedIcon sx={{ fontSize: 14, color: "var(--rose)" }} />
            {tutor?.average_rating || "New"}
          </span>
          {tutor?.total_reviews ? <span>· {tutor.total_reviews} reviews</span> : null}
          {tutor?.email && <span>· {tutor.email}</span>}
        </div>
        {skills.length > 0 && (
          <div className="tcard-skills">
            {skills.map((s) => (
              <span key={s.id || s} className="tcard-skill">{s.name || s}</span>
            ))}
          </div>
        )}
        {(reason || tutor?.reason || tutor?.bio) && (
          <p className="tcard-reason">&ldquo;{reason || tutor?.reason || tutor?.bio}&rdquo;</p>
        )}
      </div>
      {onView && (
        <StampButton variant="ghost" onClick={() => onView(tutor)}>
          {action}
        </StampButton>
      )}
    </article>
  );
}
