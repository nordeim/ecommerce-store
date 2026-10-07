import { describe, expect, it } from "vitest";
import { scryptHash, scryptVerify } from "./password";

describe("scrypt password hashing", () => {
  it("round-trips a correct password", () => {
    const hash = scryptHash("Demo1234!");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(scryptVerify("Demo1234!", hash)).toBe(true);
  });
  it("rejects a wrong password", () => {
    const hash = scryptHash("Demo1234!");
    expect(scryptVerify("Demo1234", hash)).toBe(false);
    expect(scryptVerify("demo1234!", hash)).toBe(false);
    expect(scryptVerify("", hash)).toBe(false);
  });
  it("salts every hash (two hashes of the same password differ)", () => {
    const a = scryptHash("same-password");
    const b = scryptHash("same-password");
    expect(a).not.toBe(b);
    expect(scryptVerify("same-password", a)).toBe(true);
    expect(scryptVerify("same-password", b)).toBe(true);
  });
  it("rejects malformed stored hashes without throwing", () => {
    expect(scryptVerify("x", "not-a-hash")).toBe(false);
    expect(scryptVerify("x", "scrypt$garbage")).toBe(false);
    expect(scryptVerify("x", "")).toBe(false);
  });
});
