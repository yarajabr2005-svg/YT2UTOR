import React, { useRef, useState } from "react";
import { Menu, MenuItem } from "@mui/material";

/**
 * Editorial filter chip — opens a small menu on click.
 *  k: label (eyebrow), v: current display value, options: [{ value, label }]
 */
export default function FieldChip({ k, v, placeholder = "Any", options = [], onChange }) {
  const anchor = useRef(null);
  const [open, setOpen] = useState(false);
  const display = v || placeholder;

  return (
    <>
      <button
        type="button"
        ref={anchor}
        className="chip"
        onClick={() => setOpen(true)}
      >
        <span className="chip-k">{k}</span>
        <span className="chip-v">{display}</span>
        <span className="chip-arrow">&rsaquo;</span>
      </button>
      <Menu
        anchorEl={anchor.current}
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{
          paper: {
            sx: {
              borderRadius: "2px",
              border: "1px solid var(--rule)",
              boxShadow: "0 12px 32px rgba(35,31,45,0.12)",
              fontFamily: "var(--sans)",
              minWidth: 200,
            },
          },
        }}
      >
        {options.map((opt) => (
          <MenuItem
            key={String(opt.value)}
            selected={String(opt.value) === String(v ?? "")}
            onClick={() => {
              onChange?.(opt.value);
              setOpen(false);
            }}
            sx={{
              fontFamily: "var(--sans)",
              fontSize: 14,
              "&.Mui-selected": {
                background: "transparent",
                color: "var(--rose-deep)",
                fontStyle: "normal",
                fontWeight: 600,
                fontFamily: "var(--serif)",
              },
            }}
          >
            {opt.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
