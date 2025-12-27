/**
 * Selector Helpers
 *
 * Centralized data-testid selectors for FlowPulse UI.
 * Use data-testid for stable, refactor-proof selectors.
 */

/**
 * Generate data-testid selector
 */
export function testId(id: string): string {
  return `[data-testid="${id}"]`;
}

/**
 * Authentication selectors
 */
export const auth = {
  emailInput: testId('email-input'),
  passwordInput: testId('password-input'),
  loginButton: testId('login-button'),
  signupButton: testId('signup-button'),
  userMenu: testId('user-menu'),
  logoutButton: testId('logout-button'),
} as const;

/**
 * Onboarding selectors
 */
export const onboarding = {
  qrCode: testId('whatsapp-qr-code'),
  connectionStatus: testId('connection-status'),
  templateGallery: testId('template-gallery'),
  continueButton: testId('continue-button'),
  skipButton: testId('skip-button'),
} as const;

/**
 * Dashboard selectors
 */
export const dashboard = {
  npsScore: testId('nps-score'),
  npsRing: testId('nps-ring'),
  trendIndicator: testId('trend-indicator'),
  alertBanner: testId('alert-banner'),
  responseList: testId('response-list'),
  responseCard: testId('response-card'),
  bottomNav: testId('bottom-nav'),
} as const;

/**
 * Survey selectors
 */
export const survey = {
  createButton: testId('create-survey-button'),
  templateCard: testId('survey-template-card'),
  surveyForm: testId('survey-form'),
  questionBuilder: testId('question-builder'),
  previewButton: testId('preview-button'),
  publishButton: testId('publish-button'),
} as const;

/**
 * Alert/Detractor selectors
 */
export const alert = {
  detractorCard: testId('detractor-card'),
  customerContext: testId('customer-context'),
  quickResponseMenu: testId('quick-response-menu'),
  resolveButton: testId('resolve-button'),
  celebrationCard: testId('celebration-card'),
} as const;
