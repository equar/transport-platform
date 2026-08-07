import { Alert, Snackbar, type AlertColor } from "@mui/material";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { normalizeBusinessError } from "../api/businessError";

interface ToastState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

interface ToastContextValue {
  showSuccess: (message: string) => void;
  showError: (error: unknown, fallback?: string) => void;
  showInfo: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: PropsWithChildren) {
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: "",
    severity: "info",
  });

  const show = useCallback((severity: AlertColor, message: string) => {
    setToast({ open: true, severity, message });
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      showSuccess(message) {
        show("success", message);
      },
      showError(error, fallback = "The action could not be completed.") {
        show("error", normalizeBusinessError(error, fallback).message);
      },
      showInfo(message) {
        show("info", message);
      },
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
      >
        <Alert
          severity={toast.severity}
          variant="filled"
          onClose={() => setToast((current) => ({ ...current, open: false }))}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider.");
  }

  return context;
}
