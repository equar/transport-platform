import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

export type AppearancePreference = "light" | "dark";
export type AppearanceMode = AppearancePreference;

interface AppearancePreferenceContextValue {
  preference: AppearancePreference;
  mode: AppearanceMode;
  error: string | null;
  setPreference: (preference: AppearancePreference) => void;
}

const AppearancePreferenceContext =
  createContext<AppearancePreferenceContextValue | null>(null);

function isAppearancePreference(value: string | null): value is AppearancePreference {
  return value === "light" || value === "dark";
}

function readPreference(storageKey: string): AppearancePreference {
  try {
    const stored = window.localStorage.getItem(storageKey);
    return isAppearancePreference(stored) ? stored : "light";
  } catch {
    return "light";
  }
}

export function AppearancePreferenceProvider({
  storageKey,
  children,
}: PropsWithChildren<{ storageKey: string }>) {
  const [preference, setPreferenceState] = useState<AppearancePreference>(
    () => readPreference(storageKey),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPreferenceState(readPreference(storageKey));
    setError(null);
  }, [storageKey]);

  const setPreference = useCallback(
    (nextPreference: AppearancePreference) => {
      const previousPreference = preference;
      setPreferenceState(nextPreference);
      setError(null);
      try {
        window.localStorage.setItem(storageKey, nextPreference);
      } catch {
        setPreferenceState(previousPreference);
        setError("Appearance preference could not be saved in this browser.");
      }
    },
    [preference, storageKey],
  );

  const mode = preference;
  const value = useMemo(
    () => ({ preference, mode, error, setPreference }),
    [preference, mode, error, setPreference],
  );

  return (
    <AppearancePreferenceContext.Provider value={value}>
      {children}
    </AppearancePreferenceContext.Provider>
  );
}

export function useAppearancePreference() {
  const context = useContext(AppearancePreferenceContext);
  if (!context) {
    throw new Error(
      "useAppearancePreference must be used within AppearancePreferenceProvider.",
    );
  }
  return context;
}
