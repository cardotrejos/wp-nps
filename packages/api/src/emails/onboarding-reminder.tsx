import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Button,
  Section,
  render,
} from "@react-email/components";

interface OnboardingReminderProps {
  userName: string;
  currentStep: number;
  resumeUrl: string;
}

const STEP_NAMES: Record<number, string> = {
  1: "Account Created",
  2: "Connect WhatsApp",
  3: "Verify Connection",
  4: "Select Survey Template",
};

function OnboardingReminderEmail({ userName, currentStep, resumeUrl }: OnboardingReminderProps) {
  const nextStepName = STEP_NAMES[currentStep] ?? "Complete Setup";
  const stepsCompleted = currentStep - 1;
  const totalSteps = 4;
  const progressPercent = (stepsCompleted / totalSteps) * 100;

  return (
    <Html>
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Heading style={headingStyle}>Hey {userName}!</Heading>

          <Text style={textStyle}>
            You're so close to getting your first customer feedback via WhatsApp!
          </Text>

          <Section style={progressContainerStyle}>
            <div style={{ ...progressBarStyle, width: `${progressPercent}%` }} />
          </Section>
          <Text style={progressTextStyle}>
            {stepsCompleted} of {totalSteps} steps completed
          </Text>

          <Text style={textStyle}>
            Your next step: <strong>{nextStepName}</strong>
          </Text>

          <Text style={textStyle}>
            It takes most users under 5 minutes to complete setup and start collecting NPS scores.
          </Text>

          <Section style={buttonContainerStyle}>
            <Button href={resumeUrl} style={buttonStyle}>
              Continue Setup
            </Button>
          </Section>

          <Text style={textStyle}>Questions? Just reply to this email - we're here to help!</Text>

          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              FlowPulse - WhatsApp NPS Made Simple
              <br />
              You're receiving this because you started setting up FlowPulse.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle: React.CSSProperties = {
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  lineHeight: "1.6",
  color: "#333",
  backgroundColor: "#f6f9fc",
  margin: 0,
  padding: "20px 0",
};

const containerStyle: React.CSSProperties = {
  maxWidth: "600px",
  margin: "0 auto",
  padding: "20px",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
};

const headingStyle: React.CSSProperties = {
  fontSize: "24px",
  color: "#333",
  margin: "0 0 20px",
};

const textStyle: React.CSSProperties = {
  fontSize: "16px",
  color: "#333",
  margin: "16px 0",
};

const progressContainerStyle: React.CSSProperties = {
  backgroundColor: "#e5e5e5",
  borderRadius: "10px",
  height: "8px",
  margin: "20px 0",
  overflow: "hidden",
};

const progressBarStyle: React.CSSProperties = {
  backgroundColor: "#25D366",
  height: "8px",
  borderRadius: "10px",
};

const progressTextStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "#666",
  margin: "8px 0 20px",
};

const buttonContainerStyle: React.CSSProperties = {
  margin: "24px 0",
};

const buttonStyle: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "#25D366",
  color: "#ffffff",
  padding: "12px 24px",
  textDecoration: "none",
  borderRadius: "6px",
  fontWeight: "600",
  fontSize: "16px",
};

const footerStyle: React.CSSProperties = {
  marginTop: "30px",
  borderTop: "1px solid #e5e5e5",
  paddingTop: "20px",
};

const footerTextStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "#888",
  textAlign: "center" as const,
};

export async function renderOnboardingReminderEmail(
  props: OnboardingReminderProps,
): Promise<string> {
  return await render(<OnboardingReminderEmail {...props} />);
}
