import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";

import authSource from "../auth/AuthenticatedHome.tsx?raw";
import profileSource from "../profile/ProfileCenter.tsx?raw";
import designStyles from "../../styles/design-tokens.css?raw";
import { SubscriptionNavItem } from "./SubscriptionNavItem";
import { SubscriptionPage } from "./SubscriptionPage";

describe("subscription experience", () => {
  afterEach(cleanup);

  it("shows the shared Free plan in the authenticated navigation", () => {
    render(<MemoryRouter><SubscriptionNavItem plan="free" /></MemoryRouter>);

    expect(screen.getByRole("link", { name: "Subscription plan: Free" })).toHaveAttribute("href", "/subscription");
    expect(screen.getByText("Subscription")).toBeInTheDocument();
    expect(screen.getByText("FREE")).toBeInTheDocument();
  });

  it("shows Plus distinctly in the authenticated navigation", () => {
    render(<MemoryRouter><SubscriptionNavItem plan="plus" /></MemoryRouter>);

    expect(screen.getByRole("link", { name: "Subscription plan: MayLamDi+" })).toHaveTextContent("PLUS");
  });

  it("renders both student-friendly plans and marks Free as current", () => {
    render(<MemoryRouter><SubscriptionPage currentPlan="free" /></MemoryRouter>);

    expect(screen.getByRole("heading", { name: "Compare Free and MayLamDi+." })).toBeInTheDocument();
    expect(screen.getByText("Two active projects.")).toBeInTheDocument();
    expect(screen.getByText("30 AI actions a month.")).toBeInTheDocument();
    expect(screen.getByText("39K₫")).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "MayLamDi subscription plan comparison" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Current plan" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Upgrade to Plus" }));
    expect(screen.getByRole("status")).toHaveTextContent("not connected");
  });

  it("marks MayLamDi+ as current without offering checkout again", () => {
    render(<MemoryRouter><SubscriptionPage currentPlan="plus" /></MemoryRouter>);

    expect(screen.getByLabelText("Your current plan is MayLamDi+")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Upgrade to Plus" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Included with Plus" })).toBeDisabled();
  });

  it("wires the standalone route to the existing backend plan source and removes the old accordion", () => {
    expect(authSource).toContain('path.startsWith("/subscription")');
    expect(authSource).toContain("api.aiUsage.getCurrent");
    expect(authSource).toContain("<SubscriptionNavItem plan={currentPlan} />");
    expect(authSource).toContain("<SubscriptionPage currentPlan={currentPlan} />");
    expect(profileSource).toContain('to="/subscription"');
    expect(profileSource).not.toContain("<summary>Subscription</summary>");
  });

  it("keeps the plan control compact on mobile and the pricing cards responsive", () => {
    expect(designStyles).toContain(".subscription-nav-label");
    expect(designStyles).toContain("display: none;");
    expect(designStyles).toContain(".subscription-page-heading,");
    expect(designStyles).toContain(".subscription-comparison");
    expect(designStyles).toContain(".subscription-comparison-plan--free");
    expect(designStyles).toContain(".subscription-comparison-plan--plus");
    expect(designStyles).toContain("grid-template-columns: 1fr;");
    expect(designStyles).toContain(".subscription-plan-actions");
    expect(designStyles).toContain("background: transparent;");
    expect(designStyles).toContain("margin: var(--mld-space-5) 0 0;");
  });
});
