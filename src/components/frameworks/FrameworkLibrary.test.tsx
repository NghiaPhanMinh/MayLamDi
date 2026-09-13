import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { vi } from "vitest";

import { FrameworkLibrary } from "./FrameworkLibrary";

describe("FrameworkLibrary", () => {
  afterEach(cleanup);

  it("switches between complete framework previews", () => {
    const onDuplicate = vi.fn();
    render(<FrameworkLibrary onDuplicate={onDuplicate} />);

    expect(
      screen.getByRole("heading", { name: "Software & Web/App Engineering" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /View phase details/i }));
    expect(screen.getByText("Requirements Analysis & Ideation Selection")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /Academic Research/i }),
    );

    expect(
      screen.getByRole("heading", { name: "Academic Research & Thesis" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Literature Review & Hypothesis")).toBeInTheDocument();
    expect(screen.getByText("Defense Deck & Final Submission")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /Copy and customise/i }),
    );
    expect(onDuplicate).toHaveBeenCalledWith(
      expect.objectContaining({ id: "academic-research-thesis" }),
    );
  });

  it("keeps all built-in cards persistently coloured and numbered", () => {
    const { container } = render(<FrameworkLibrary onDuplicate={vi.fn()} />);

    const cards = [...container.querySelectorAll<HTMLElement>(".framework-picker-card")];
    expect(cards).toHaveLength(10);
    expect(cards.map((card) => card.querySelector(".framework-card-number")?.textContent)).toEqual([
      "01", "02", "03", "04", "05", "06", "07", "08", "09", "10",
    ]);
  });
});
