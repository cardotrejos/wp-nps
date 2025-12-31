import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NPSRatingButtons } from "../nps-rating-buttons";

describe("NPSRatingButtons", () => {
  it("renders 0-10 rating buttons for standard NPS scale", () => {
    render(<NPSRatingButtons min={0} max={10} />);
    for (let i = 0; i <= 10; i++) {
      expect(screen.getByRole("button", { name: `Rating ${i}` })).toBeInTheDocument();
    }
  });

  it("renders buttons for custom scale range", () => {
    render(<NPSRatingButtons min={1} max={5} />);
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByRole("button", { name: `Rating ${i}` })).toBeInTheDocument();
    }
    // Should not have 0
    expect(screen.queryByRole("button", { name: "Rating 0" })).not.toBeInTheDocument();
  });

  it("renders scale labels when provided", () => {
    render(
      <NPSRatingButtons
        min={0}
        max={10}
        labels={{ min: "Not at all likely", max: "Extremely likely" }}
      />,
    );
    expect(screen.getByText("Not at all likely")).toBeInTheDocument();
    expect(screen.getByText("Extremely likely")).toBeInTheDocument();
  });

  it("does not render labels when not provided", () => {
    render(<NPSRatingButtons min={0} max={10} />);
    expect(screen.queryByText("Not at all likely")).not.toBeInTheDocument();
  });

  it("buttons are disabled in preview mode", () => {
    render(<NPSRatingButtons min={0} max={10} />);
    const buttons = screen.getAllByRole("button");
    for (const button of buttons) {
      expect(button).toHaveProperty("disabled", true);
    }
  });

  // NPS 0-10 scale color tests
  describe("NPS 0-10 scale colors", () => {
    it("applies correct color to detractor ratings (0-6)", () => {
      render(<NPSRatingButtons min={0} max={10} />);
      const button6 = screen.getByRole("button", { name: "Rating 6" });
      expect(button6.className).toContain("bg-red-100");
    });

    it("applies correct color to passive ratings (7-8)", () => {
      render(<NPSRatingButtons min={0} max={10} />);
      const button7 = screen.getByRole("button", { name: "Rating 7" });
      const button8 = screen.getByRole("button", { name: "Rating 8" });
      expect(button7.className).toContain("bg-yellow-100");
      expect(button8.className).toContain("bg-yellow-100");
    });

    it("applies correct color to promoter ratings (9-10)", () => {
      render(<NPSRatingButtons min={0} max={10} />);
      const button9 = screen.getByRole("button", { name: "Rating 9" });
      const button10 = screen.getByRole("button", { name: "Rating 10" });
      expect(button9.className).toContain("bg-green-100");
      expect(button10.className).toContain("bg-green-100");
    });
  });

  // CSAT 1-5 scale color tests (verifies scale-agnostic algorithm)
  describe("CSAT 1-5 scale colors", () => {
    it("applies correct colors for CSAT scale", () => {
      render(<NPSRatingButtons min={1} max={5} />);

      // 1-3 should be red (bottom 60% = 0-0.6 of range)
      expect(screen.getByRole("button", { name: "Rating 1" }).className).toContain("bg-red-100");
      expect(screen.getByRole("button", { name: "Rating 2" }).className).toContain("bg-red-100");
      expect(screen.getByRole("button", { name: "Rating 3" }).className).toContain("bg-red-100");

      // 4 should be yellow (60-80% of range)
      expect(screen.getByRole("button", { name: "Rating 4" }).className).toContain("bg-yellow-100");

      // 5 should be green (top 20%)
      expect(screen.getByRole("button", { name: "Rating 5" }).className).toContain("bg-green-100");
    });
  });

  // CES 1-7 scale color tests
  describe("CES 1-7 scale colors", () => {
    it("applies correct colors for CES scale", () => {
      render(<NPSRatingButtons min={1} max={7} />);

      // 1-4 should be red (bottom ~60%)
      expect(screen.getByRole("button", { name: "Rating 1" }).className).toContain("bg-red-100");
      expect(screen.getByRole("button", { name: "Rating 4" }).className).toContain("bg-red-100");

      // 5-6 should be yellow (middle ~20%)
      expect(screen.getByRole("button", { name: "Rating 5" }).className).toContain("bg-yellow-100");

      // 7 should be green (top ~20%)
      expect(screen.getByRole("button", { name: "Rating 7" }).className).toContain("bg-green-100");
    });
  });

  it("applies custom className", () => {
    const { container } = render(<NPSRatingButtons min={0} max={10} className="custom-class" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.classList.contains("custom-class")).toBe(true);
  });

  it("has accessible group role", () => {
    render(<NPSRatingButtons min={0} max={10} />);
    expect(screen.getByRole("group", { name: "Rating scale" })).toBeInTheDocument();
  });
});
