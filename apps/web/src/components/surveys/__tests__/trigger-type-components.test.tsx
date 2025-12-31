import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiEndpointDisplay } from "../api-endpoint-display";
import { ManualSendButton } from "../manual-send-button";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

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
    it("shows disabled button with activate message", () => {
      render(
        <ManualSendButton surveyId="test-survey-123" surveyName="Test Survey" isActive={false} />,
        { wrapper: Wrapper },
      );
      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("shows activation instructions", () => {
      render(
        <ManualSendButton surveyId="test-survey-123" surveyName="Test Survey" isActive={false} />,
        { wrapper: Wrapper },
      );
      expect(screen.getByText(/Activate your survey first/)).toBeInTheDocument();
    });

    it("displays Manual Send title", () => {
      render(
        <ManualSendButton surveyId="test-survey-123" surveyName="Test Survey" isActive={false} />,
        { wrapper: Wrapper },
      );
      expect(screen.getByText("Manual Send")).toBeInTheDocument();
    });
  });

  describe("when survey is active", () => {
    it("displays enabled send button", () => {
      render(
        <ManualSendButton surveyId="test-survey-123" surveyName="Test Survey" isActive={true} />,
        { wrapper: Wrapper },
      );
      expect(screen.getByRole("button")).not.toBeDisabled();
    });

    it("shows send instruction text", () => {
      render(
        <ManualSendButton surveyId="test-survey-123" surveyName="Test Survey" isActive={true} />,
        { wrapper: Wrapper },
      );
      expect(screen.getByText(/Enter a phone number/)).toBeInTheDocument();
    });

    it("displays Manual Send title", () => {
      render(
        <ManualSendButton surveyId="test-survey-123" surveyName="Test Survey" isActive={true} />,
        { wrapper: Wrapper },
      );
      expect(screen.getByText("Manual Send")).toBeInTheDocument();
    });

    it("displays Send Survey Manually button text", () => {
      render(
        <ManualSendButton surveyId="test-survey-123" surveyName="Test Survey" isActive={true} />,
        { wrapper: Wrapper },
      );
      expect(screen.getByText("Send Survey Manually")).toBeInTheDocument();
    });
  });
});
