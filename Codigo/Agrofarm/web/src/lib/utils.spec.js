import { describe, expect, it } from "vitest";
import { cn } from "./utils.js";

describe("cn", () => {
  it("combina classes com tailwind-merge", () => {
    expect(cn("px-2", "px-4", "text-sm")).toBe("px-4 text-sm");
    expect(cn("hidden", false && "block", undefined, "flex")).toBe("flex");
  });
});
