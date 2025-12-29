import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WhatsAppMessage } from "../whatsapp-message";

describe("WhatsAppMessage", () => {
  it("renders the message text", () => {
    render(<WhatsAppMessage text="Hello, how are you?" />);
    expect(screen.getByText("Hello, how are you?")).toBeInTheDocument();
  });

  it("displays a timestamp", () => {
    render(<WhatsAppMessage text="Test message" />);
    // Timestamp should be in format like "10:30 AM"
    const timestampPattern = /\d{1,2}:\d{2}\s?(AM|PM)/i;
    const elements = screen.getAllByText(timestampPattern);
    expect(elements.length).toBeGreaterThan(0);
  });

  it("uses provided timestamp for deterministic rendering", () => {
    const fixedDate = new Date("2025-01-15T14:30:00");
    render(<WhatsAppMessage text="Test message" timestamp={fixedDate} />);
    expect(screen.getByText("2:30 PM")).toBeInTheDocument();
  });

  it("shows double checkmarks for delivered status", () => {
    const { container } = render(<WhatsAppMessage text="Test message" />);
    // Check for the check icons (there should be 2 for double checkmarks)
    const checkIcons = container.querySelectorAll("svg.lucide-check");
    expect(checkIcons.length).toBe(2);
  });

  it("applies custom className", () => {
    const { container } = render(<WhatsAppMessage text="Test" className="custom-class" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.classList.contains("custom-class")).toBe(true);
  });

  it("preserves whitespace in messages", () => {
    render(<WhatsAppMessage text={"Line 1\nLine 2"} />);
    // The text node contains the newline preserved by whitespace-pre-wrap CSS
    const element = screen.getByText(/Line 1/);
    expect(element.textContent).toContain("Line 1");
    expect(element.textContent).toContain("Line 2");
  });

  it("has accessible article role", () => {
    render(<WhatsAppMessage text="Test message" />);
    expect(screen.getByRole("article", { name: "Survey question message" })).toBeInTheDocument();
  });
});
