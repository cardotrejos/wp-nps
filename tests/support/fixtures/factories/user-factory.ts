/**
 * User Factory
 *
 * Creates test users via API with auto-cleanup.
 * Follows FlowPulse patterns from project-context.md.
 */

type UserOverrides = {
  email?: string;
  name?: string;
  password?: string;
  organizationName?: string;
};

type CreatedUser = {
  id: string;
  email: string;
  name: string;
  password: string;
  organizationId: string;
  organizationName: string;
};

export class UserFactory {
  private createdUsers: CreatedUser[] = [];
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.API_URL || 'http://localhost:3000/api';
  }

  /**
   * Create a test user with organization
   *
   * FlowPulse uses Better Auth with organization plugin (AR1)
   */
  async createUser(overrides: UserOverrides = {}): Promise<CreatedUser> {
    const timestamp = Date.now();
    const user = {
      email: overrides.email || `test-${timestamp}@flowpulse.test`,
      name: overrides.name || `Test User ${timestamp}`,
      password: overrides.password || `TestPass${timestamp}!`,
      organizationName: overrides.organizationName || `Test Org ${timestamp}`,
    };

    // Create user via signup endpoint
    const response = await fetch(`${this.apiUrl}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        password: user.password,
        name: user.name,
        organizationName: user.organizationName,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create test user: ${response.statusText}`);
    }

    const created = (await response.json()) as {
      user: { id: string };
      organization: { id: string };
    };

    const fullUser: CreatedUser = {
      id: created.user.id,
      email: user.email,
      name: user.name,
      password: user.password,
      organizationId: created.organization.id,
      organizationName: user.organizationName,
    };

    this.createdUsers.push(fullUser);
    return fullUser;
  }

  /**
   * Cleanup all created users
   *
   * Called automatically after each test via fixture pattern
   */
  async cleanup(): Promise<void> {
    for (const user of this.createdUsers) {
      try {
        await fetch(`${this.apiUrl}/test/cleanup/user/${user.id}`, {
          method: 'DELETE',
        });
      } catch {
        // Silently fail cleanup - test environment may be reset
        console.warn(`Failed to cleanup user ${user.id}`);
      }
    }
    this.createdUsers = [];
  }
}
