import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { fetchPendingQualifications, verifyQualification } from "../../api/learning";
import { asArray, formatDate, getErrorMessage } from "../../utils/workspace";
import { EmptyState, MessageBar, Panel, TutorAvatar } from "./WorkspacePrimitives";

export default function AdminWorkspace() {
  const [qualifications, setQualifications] = useState([]);
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState("");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const clearMessage = () => {
    setError("");
    setMessage("");
  };

  const load = async () => {
    const data = await fetchPendingQualifications();
    const rows = asArray(data);
    setQualifications(rows);
    setSelected((current) => rows.find((row) => row.id === current?.id) || rows[0] || null);
  };

  useEffect(() => {
    // Initial backend hydration for pending qualification reviews.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load().catch(() => setQualifications([]));
  }, []);

  const review = async (status) => {
    if (!selected) return;
    try {
      await verifyQualification(selected.id, { status, notes });
      setMessage(`Qualification ${status}.`);
      setNotes("");
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Could not review qualification."));
    }
  };

  const filtered = qualifications.filter((item) => {
    const haystack = `${item.file_name} ${item.skill?.name} ${item.tutor_id}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <Stack spacing={3}>
      <MessageBar error={error} message={message} onClose={clearMessage} />
      <Box className="admin-grid">
        <Panel title="Pending qualifications" icon={<VerifiedRoundedIcon />}>
          <Stack spacing={2}>
            <Box className="admin-toolbar">
              <TextField
                placeholder="Search by tutor or skill"
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
              <Button variant="outlined">Filter</Button>
            </Box>
            <Box className="qualification-list">
              {filtered.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`admin-row ${selected?.id === item.id ? "is-selected" : ""}`}
                  onClick={() => setSelected(item)}
                >
                  <TutorAvatar tutor={{ username: item.tutor_id }} size={42} />
                  <span>
                    <strong>{item.skill?.name || "Qualification"}</strong>
                    <small>{item.file_name}</small>
                  </span>
                  <small>{formatDate(item.uploaded_at?.slice(0, 10))}</small>
                  <span className="status-pill status-pending">Pending review</span>
                </button>
              ))}
              {!filtered.length && <EmptyState title="No pending qualifications." />}
            </Box>
          </Stack>
        </Panel>

        <Panel title="Uploaded qualification">
          {selected ? (
            <Stack spacing={2.2}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <TutorAvatar tutor={{ username: selected.tutor_id }} size={72} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h6">{selected.skill?.name || "Tutor qualification"}</Typography>
                  <Typography color="text.secondary">{selected.tutor_id}</Typography>
                </Box>
                <span className="status-pill status-pending">Pending review</span>
              </Stack>

              <Box className="file-card">
                <InsertDriveFileRoundedIcon color="error" />
                <Box sx={{ minWidth: 0 }}>
                  <Typography fontWeight={900}>{selected.file_name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selected.file_size ? `${Math.round(selected.file_size / 1024)} KB` : "Uploaded file"}
                  </Typography>
                </Box>
                <Button href={selected.file_url} target="_blank" rel="noreferrer" variant="outlined" startIcon={<DownloadRoundedIcon />}>
                  Open
                </Button>
              </Box>

              <Box className="document-preview">
                <InsertDriveFileRoundedIcon />
                <Typography>Document preview</Typography>
                <Typography variant="body2" color="text.secondary">Open the uploaded file to view the original document.</Typography>
              </Box>

              <TextField
                label="Review notes"
                multiline
                minRows={5}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Add notes about this qualification (optional)"
              />
              <Stack direction="row" spacing={1.2} justifyContent="flex-end">
                <Button variant="outlined" color="error" startIcon={<CloseRoundedIcon />} onClick={() => review("rejected")}>
                  Reject
                </Button>
                <Button variant="contained" color="success" startIcon={<CheckRoundedIcon />} onClick={() => review("approved")}>
                  Approve
                </Button>
              </Stack>
            </Stack>
          ) : (
            <EmptyState title="Select an upload to review." />
          )}
        </Panel>
      </Box>
    </Stack>
  );
}
