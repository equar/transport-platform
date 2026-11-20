import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it } from "vitest";
import { AppearancePreferenceProvider } from "../theme/AppearancePreferenceContext";
import { AppearancePreferenceCard } from "./AppearancePreferenceCard";

beforeEach(() => window.localStorage.clear());
afterEach(cleanup);
it("offers only Light and Dark and saves the selected mode", () => {
 render(<AppearancePreferenceProvider storageKey="appearance-test"><AppearancePreferenceCard /></AppearancePreferenceProvider>);
 expect(screen.getAllByRole("button")).toHaveLength(2);
 expect(screen.queryByText("System")).toBeNull();
 expect(screen.getByRole("button", { name: "Light" }).getAttribute("aria-pressed")).toBe("true");
 fireEvent.click(screen.getByRole("button", { name: "Dark" }));
 expect(screen.getByRole("button", { name: "Dark" }).getAttribute("aria-pressed")).toBe("true");
 expect(window.localStorage.getItem("appearance-test")).toBe("dark");
 fireEvent.click(screen.getByRole("button", { name: "Dark" }));
 expect(screen.getByRole("button", { name: "Dark" }).getAttribute("aria-pressed")).toBe("true");
});
