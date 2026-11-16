import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppearancePreferenceProvider, useAppearancePreference } from "./AppearancePreferenceContext";
import { createAppTheme } from "./theme";

function PreferenceProbe() {
  const { preference, mode, setPreference } = useAppearancePreference();
  return (
    <>
      <div>{`${preference}|${mode}`}</div>
      <button onClick={() => setPreference("dark")}>Select dark</button>
    </>
  );
}

describe("appearance preferences", () => {
  let systemPrefersDark = false;

  beforeEach(() => {
    systemPrefersDark = false;
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: systemPrefersDark && query.includes("prefers-color-scheme: dark"),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses the system theme until the account selects and saves an override", async () => {
    render(
      <AppearancePreferenceProvider storageKey="test-appearance">
        <PreferenceProbe />
      </AppearancePreferenceProvider>,
    );

    expect(screen.getByText("system|light")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Select dark" }));

    await waitFor(() => {
      expect(screen.getByText("dark|dark")).toBeTruthy();
      expect(window.localStorage.getItem("test-appearance")).toBe("dark");
    });
  });

  it("creates a dark palette when dark appearance is selected", () => {
    const theme = createAppTheme(undefined, "admin", "dark");

    expect(theme.palette.mode).toBe("dark");
    expect(theme.palette.background.default).not.toBe("#faf9f6");
    expect(theme.palette.text.primary).toBe("#edf3f8");
  });
});
