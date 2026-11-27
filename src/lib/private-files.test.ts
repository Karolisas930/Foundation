import { describe, it, expect } from "vitest";
import { isOwnPath } from "./private-files.server";

const me = "11111111-1111-1111-1111-111111111111";
const other = "22222222-2222-2222-2222-222222222222";

describe("private file ownership", () => {
  it("allows files in the user's own folder", () => {
    expect(isOwnPath(`${me}/insurance/123_policy.pdf`, me)).toBe(true);
  });
  it("blocks another user's files", () => {
    expect(isOwnPath(`${other}/receipt.jpg`, me)).toBe(false);
  });
  it("blocks folder escapes", () => {
    expect(isOwnPath(`${me}/../${other}/x.pdf`, me)).toBe(false);
  });
});
