import { describe, it, expect } from "vitest";
import { maskPhoneNumber } from "./phone-mask";

describe("maskPhoneNumber", () => {
  it("masks Brazilian phone number correctly", () => {
    expect(maskPhoneNumber("+5511999999999")).toBe("+55*******9999");
  });

  it("masks US phone number correctly", () => {
    expect(maskPhoneNumber("+14155551234")).toBe("+14*****1234");
  });

  it("masks UK phone number correctly", () => {
    expect(maskPhoneNumber("+447911123456")).toBe("+44******3456");
  });

  it("handles short phone numbers gracefully", () => {
    expect(maskPhoneNumber("+12345")).toBe("****");
    expect(maskPhoneNumber("")).toBe("****");
  });

  it("handles edge case with 8-9 characters", () => {
    expect(maskPhoneNumber("+1234567")).toBe("+12*4567");
    expect(maskPhoneNumber("+12345678")).toBe("+12**5678");
  });

  it("handles null/undefined gracefully", () => {
    expect(maskPhoneNumber(null as unknown as string)).toBe("****");
    expect(maskPhoneNumber(undefined as unknown as string)).toBe("****");
  });
});
