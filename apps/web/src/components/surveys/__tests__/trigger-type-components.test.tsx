import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ApiEndpointDisplay } from "../api-endpoint-display";
import { ManualSendButton } from "../manual-send-button";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("ApiEndpointDisplay", () => {
  it("renders endpoint with survey ID", () => {
    render(<ApiEndpointDisplay surveyId="test-survey-123" />);
    expect(screen.getByText(/test-survey-123/)).toBeInTheDocument();
  });

  it("shows Coming Soon badge", () => {
    render(<ApiEndpointDisplay surveyId="test-survey-123" />);
    expect(screen.getByText("Coming Soon")).toBeInTheDocument();
  });

  it("displays API Endpoint title", () => {
    render(<ApiEndpointDisplay surveyId="test-survey-123" />);
    expect(screen.getByText("API Endpoint")).toBeInTheDocument();
  });

  it("shows Epic 3 availability message", () => {
    render(<ApiEndpointDisplay surveyId="test-survey-123" />);
    expect(screen.getByText(/Epic 3/)).toBeInTheDocument();
  });

  it("displays copy button", () => {
    render(<ApiEndpointDisplay surveyId="test-survey-123" />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});

describe("ManualSendButton", () => {
  describe("when survey is inactive", () => {
    it("shows activate message", () => {
      render(<ManualSendButton surveyId="test-survey-123" isActive={false} />);
      expect(screen.getByText("Activate Survey to Send")).toBeInTheDocument();
    });

    it("displays disabled button", () => {
      render(<ManualSendButton surveyId="test-survey-123" isActive={false} />);
      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("shows activation instructions", () => {
      render(<ManualSendButton surveyId="test-survey-123" isActive={false} />);
      expect(screen.getByText(/Activate your survey first/)).toBeInTheDocument();
    });
  });

  describe("when survey is active", () => {
    it("shows Coming Soon badge", () => {
      render(<ManualSendButton surveyId="test-survey-123" isActive={true} />);
      expect(screen.getByText("Coming Soon")).toBeInTheDocument();
    });

    it("displays disabled send button", () => {
      render(<ManualSendButton surveyId="test-survey-123" isActive={true} />);
      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("shows Epic 3 availability message", () => {
      render(<ManualSendButton surveyId="test-survey-123" isActive={true} />);
      expect(screen.getByText(/Epic 3/)).toBeInTheDocument();
    });

    it("displays Manual Send title", () => {
      render(<ManualSendButton surveyId="test-survey-123" isActive={true} />);
      expect(screen.getByText("Manual Send")).toBeInTheDocument();
    });
  });
});
