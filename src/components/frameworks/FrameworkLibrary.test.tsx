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
      screen.getByRole("heading", { name: "Nonlinear Design Process" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /View phase details/i }));
    expect(screen.getByText("Empathise")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /Academic Research/i }),
    );

    expect(
      screen.getByRole("heading", { name: "Research Project Framework" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Research Question")).toBeInTheDocument();
    expect(screen.getByText("Review and Submission")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /Copy and customise/i }),
    );
    expect(onDuplicate).toHaveBeenCalledWith(
      expect.objectContaining({ id: "academic-research" }),
    );
  });

  it("keeps all built-in cards persistently coloured and numbered", () => {
    const { container } = render(<FrameworkLibrary onDuplicate={vi.fn()} />);

    const cards = [...container.querySelectorAll<HTMLElement>(".framework-picker-card")];
    expect(cards).toHaveLength(7);
    expect(cards.map((card) => card.style.getPropertyValue("--framework-card-color"))).toEqual([
      "#FF8AE7",
      "#FFF73F",
      "#FEAA01",
      "#1DD851",
      "#FD39E4",
      "#4CA0FE",
      "#17A738",
    ]);
    expect(cards.map((card) => card.querySelector(".framework-card-number")?.textContent)).toEqual([
      "01", "02", "03", "04", "05", "06", "07",
    ]);
  });
});
