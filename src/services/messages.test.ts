import { describe, expect, it } from "vitest";
import { isUnread, matchIdFor, otherMember, previewText, validateMessage } from "./messages";

describe("messages helpers", () => {
  it("builds the same match id regardless of order and finds the other member", () => {
    expect(matchIdFor("b", "a")).toBe("a_b");
    expect(matchIdFor("a", "b")).toBe("a_b");
    expect(otherMember("a_b", "a")).toBe("b");
    expect(otherMember("a_b", "b")).toBe("a");
  });

  it("validates and previews message text", () => {
    expect(validateMessage("   ")).not.toBeNull();
    expect(validateMessage("hi")).toBeNull();
    expect(validateMessage("x".repeat(2001))).not.toBeNull();
    expect(previewText("  a\n\n b ").length).toBeLessThanOrEqual(120);
    expect(previewText("  a\n\n b ")).toBe("a b");
  });

  it("flags only other members' newer messages as unread", () => {
    expect(isUnread({ lastMessageAt: 10, lastSenderId: "b" }, "a", 5)).toBe(true);
    expect(isUnread({ lastMessageAt: 10, lastSenderId: "b" }, "a", 10)).toBe(false);
    expect(isUnread({ lastMessageAt: 10, lastSenderId: "a" }, "a", 0)).toBe(false);
    expect(isUnread({ lastMessageAt: 10, lastSenderId: "" }, "a", 0)).toBe(false);
  });
});
