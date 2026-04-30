/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import ToastStack from "../components/feedback/ToastStack";
import ConfirmDialog from "../components/feedback/ConfirmDialog";
const MAX_TOASTS = 4;

const FeedbackContext = createContext(null);

function newToastId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `t-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const confirmResolverRef = useRef(null);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback((variant, message, title) => {
    const id = newToastId();
    setToasts((prev) => {
      const next = [...prev, { id, variant, message, title: title || undefined }];
      return next.slice(-MAX_TOASTS);
    });
  }, []);

  const notify = useMemo(
    () => ({
      success: (message, title) => pushToast("success", message, title),
      error: (message, title) => pushToast("error", message, title),
      warning: (message, title) => pushToast("warning", message, title),
      info: (message, title) => pushToast("info", message, title),
    }),
    [pushToast],
  );

  const confirm = useCallback((options) => {
    if (confirmState) {
      return Promise.resolve(false);
    }
    return new Promise((resolve) => {
      setConfirmState(options);
      confirmResolverRef.current = resolve;
    });
  }, [confirmState]);

  const closeConfirm = useCallback((result) => {
    setConfirmState(null);
    const fn = confirmResolverRef.current;
    confirmResolverRef.current = null;
    if (fn) fn(result);
  }, []);

  const value = useMemo(() => ({ notify, confirm }), [notify, confirm]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      <ConfirmDialog open={!!confirmState} options={confirmState} onClose={closeConfirm} />
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error("useFeedback must be used within FeedbackProvider");
  }
  return ctx;
}
