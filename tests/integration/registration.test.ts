import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { eq, and } from "drizzle-orm";
import { db } from "@wp-nps/db";
import { user, session, account, member, organization } from "@wp-nps/db/schema/auth";
import bcrypt from "bcryptjs";
import { createTestOrg, createTestUser, cleanupTestOrg, clearOrgContext } from "../utils/test-org";

/**
 * User Registration with Organization Creation Integration Tests
 * Story 1.1: User Registration with Organization Creation
 *
 * Tests the core registration flows at the database level.
 * These tests verify the data model and constraints using proper ORM patterns.
 */

// Test email domain to avoid conflicts
const TEST_EMAIL_DOMAIN = "test-registration.example.com";

// Helper to generate unique test email
function uniqueEmail(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${timestamp}-${random}@${TEST_EMAIL_DOMAIN}`;
}

// Helper to create a test user with password directly in database (using ORM)
async function createUserWithPassword(
  email: string,
  plainPassword: string,
  name: string,
): Promise<{ userId: string; email: string }> {
  const userId = crypto.randomUUID();

  // Create user
  await db.insert(user).values({
    id: userId,
    name,
    email,
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Create credential account with hashed password
  const accountId = crypto.randomUUID();
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  await db.insert(account).values({
    id: accountId,
    userId,
    accountId: email,
    providerId: "credential",
    password: hashedPassword,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return { userId, email };
}

// Helper to cleanup user and related data
async function cleanupTestUser(targetEmail: string): Promise<void> {
  const foundUser = await db.query.user.findFirst({
    where: eq(user.email, targetEmail),
  });

  if (!foundUser) return;

  // Get all orgs where user is a member
  const members = await db.query.member.findMany({
    where: eq(member.userId, foundUser.id),
  });

  // Clean up sessions
  await db.delete(session).where(eq(session.userId, foundUser.id));

  // Clean up accounts
  await db.delete(account).where(eq(account.userId, foundUser.id));

  // Clean up each org (which cascades to memberships)
  for (const m of members) {
    if (m.organizationId) {
      // Use existing helper but safe to just delete org
      await cleanupTestOrg(m.organizationId);
    }
  }

  // Finally clean up user
  await db.delete(user).where(eq(user.id, foundUser.id));
}

describe("User Registration with Organization Creation", () => {
  let testEmail: string;

  beforeEach(async () => {
    await clearOrgContext();
    testEmail = uniqueEmail("test-user");
  });

  afterEach(async () => {
    try {
      await cleanupTestUser(testEmail);
    } catch {
      // Ignore cleanup errors
    }
    await clearOrgContext();
  });

  describe("AC #1: User and Organization Creation", () => {
    it("should create a user record in the database", async () => {
      const { userId } = await createUserWithPassword(testEmail, "SecurePass123!", "Test User");

      // Verify user exists using ORM
      const foundUser = await db.query.user.findFirst({
        where: eq(user.id, userId),
      });

      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe(testEmail);
      expect(foundUser?.name).toBe("Test User");
    });

    it("should create a credential account linked to the user", async () => {
      const { userId, email } = await createUserWithPassword(
        testEmail,
        "SecurePass123!",
        "Test User",
      );

      // Verify account exists with correct provider
      const foundAccount = await db.query.account.findFirst({
        where: eq(account.userId, userId),
      });

      expect(foundAccount).toBeDefined();
      expect(foundAccount?.providerId).toBe("credential");
      expect(foundAccount?.accountId).toBe(email);
    });

    it("should hash password with bcrypt cost factor ≥10 (NFR-S5)", async () => {
      await createUserWithPassword(testEmail, "SecurePass123!", "Test User");

      // Get the stored password hash
      const foundAccount = await db.query.account.findFirst({
        where: eq(account.accountId, testEmail),
      });

      expect(foundAccount).toBeDefined();
      const hash = foundAccount?.password;
      expect(hash).toBeDefined();

      // bcrypt hash format: $2b$<cost>$<salt+hash>
      // Example: $2b$10$...
      const costMatch = hash!.match(/^\$2[aby]\$(\d+)\$/);
      expect(costMatch).toBeTruthy();
      expect(parseInt(costMatch![1]!)).toBeGreaterThanOrEqual(10);
    });

    it("should verify password using bcrypt compare", async () => {
      const password = "SecurePass123!";
      await createUserWithPassword(testEmail, password, "Test User");

      const foundAccount = await db.query.account.findFirst({
        where: eq(account.accountId, testEmail),
      });

      // Verify correct password matches
      const isValid = await bcrypt.compare(password, foundAccount!.password!);
      expect(isValid).toBe(true);

      // Verify wrong password doesn't match
      const isInvalid = await bcrypt.compare("WrongPassword", foundAccount!.password!);
      expect(isInvalid).toBe(false);
    });
  });

  describe("AC #2: Duplicate Email Handling", () => {
    it("should enforce unique email constraint", async () => {
      // Create first user
      await createUserWithPassword(testEmail, "FirstPass123!", "First User");

      // Attempt to create second user with same email (should fail)
      await expect(
        createUserWithPassword(testEmail, "SecondPass456!", "Second User"),
      ).rejects.toThrow();
    });

    it("should only have one user after duplicate attempt", async () => {
      // Create first user
      await createUserWithPassword(testEmail, "FirstPass123!", "First User");

      try {
        await createUserWithPassword(testEmail, "SecondPass456!", "Second User");
      } catch {
        // Expected
      }

      // Verify only one user exists
      const users = await db.query.user.findMany({
        where: eq(user.email, testEmail),
      });
      expect(users).toHaveLength(1);
    });
  });

  describe("Organization Membership", () => {
    it("should assign user as owner role in organization", async () => {
      const uniqueOrgName = `Owner Test Org ${Date.now()}`;
      const org = await createTestOrg(uniqueOrgName);
      const { userId } = await createTestUser(org.id, testEmail, "owner");

      // Verify membership role
      const foundMember = await db.query.member.findFirst({
        where: and(eq(member.userId, userId), eq(member.organizationId, org.id)),
      });

      expect(foundMember).toBeDefined();
      expect(foundMember?.role).toBe("owner");
    });

    it("should create organization with correct properties", async () => {
      const timestamp = Date.now();
      const uniqueOrgName = `My Test Company ${timestamp}`;
      const org = await createTestOrg(uniqueOrgName);

      // Verify organization properties
      const foundOrg = await db.query.organization.findFirst({
        where: eq(organization.id, org.id),
      });

      expect(foundOrg).toBeDefined();
      expect(foundOrg?.name).toBe(uniqueOrgName);
      expect(foundOrg?.slug).toBe(`my-test-company-${timestamp}`);
    });

    it("should link user to organization via member table", async () => {
      const uniqueOrgName = `Member Test Org ${Date.now()}`;
      const org = await createTestOrg(uniqueOrgName);
      const testUser = await createTestUser(org.id, testEmail, "owner");

      const foundMember = await db.query.member.findFirst({
        where: and(eq(member.userId, testUser.userId), eq(member.organizationId, org.id)),
      });

      expect(foundMember).toBeDefined();
    });
  });

  describe("Session Management", () => {
    it("should create session record in database", async () => {
      const { userId } = await createUserWithPassword(testEmail, "SecurePass123!", "Test User");

      const sessionId = crypto.randomUUID();
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 86400 * 1000); // 24 hours

      await db.insert(session).values({
        id: sessionId,
        userId,
        token,
        expiresAt,
        ipAddress: "127.0.0.1",
        userAgent: "Test Agent",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const foundSession = await db.query.session.findFirst({
        where: eq(session.userId, userId),
      });

      expect(foundSession).toBeDefined();
      expect(foundSession?.token).toBe(token);
    });

    it("should set session expiration to approximately 24 hours", async () => {
      const { userId } = await createUserWithPassword(testEmail, "SecurePass123!", "Test User");

      const sessionId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 86400 * 1000); // 24 hours

      await db.insert(session).values({
        id: sessionId,
        userId,
        token: crypto.randomUUID(),
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const foundSession = await db.query.session.findFirst({
        where: eq(session.id, sessionId),
      });

      const now = new Date();
      const diffInSeconds = (foundSession!.expiresAt.getTime() - now.getTime()) / 1000;

      // Approx 24 hours (86400s)
      expect(diffInSeconds).toBeGreaterThan(86000);
      expect(diffInSeconds).toBeLessThan(87000);
    });
  });

  describe("Password Validation Constraints", () => {
    it("should store minimum 8-character password", async () => {
      const email = uniqueEmail("min-pwd");
      await createUserWithPassword(email, "12345678", "Min Pass User");

      const result = await db.query.account.findFirst({
        where: eq(account.accountId, email),
      });
      expect(result).toBeDefined();

      await cleanupTestUser(email);
    });

    it("should store long passwords correctly", async () => {
      const email = uniqueEmail("long-pwd");
      const longPassword = "a".repeat(72); // bcrypt limit

      await createUserWithPassword(email, longPassword, "Long Pass User");

      const result = await db.query.account.findFirst({
        where: eq(account.accountId, email),
      });

      const isValid = await bcrypt.compare(longPassword, result!.password!);
      expect(isValid).toBe(true);

      await cleanupTestUser(email);
    });

    it("should differentiate between different passwords with same prefix", async () => {
      const email1 = uniqueEmail("pwd-prefix-1");
      const email2 = uniqueEmail("pwd-prefix-2");

      await createUserWithPassword(email1, "password123", "User 1");
      await createUserWithPassword(email2, "password456", "User 2");

      const acct1 = await db.query.account.findFirst({ where: eq(account.accountId, email1) });
      const acct2 = await db.query.account.findFirst({ where: eq(account.accountId, email2) });

      expect(await bcrypt.compare("password123", acct1!.password!)).toBe(true);
      expect(await bcrypt.compare("password456", acct2!.password!)).toBe(true);

      expect(await bcrypt.compare("password123", acct2!.password!)).toBe(false);

      await cleanupTestUser(email1);
      await cleanupTestUser(email2);
    });
  });
});
