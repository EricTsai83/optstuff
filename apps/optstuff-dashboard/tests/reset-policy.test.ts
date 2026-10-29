import assert from "node:assert/strict";
import { test } from "node:test";
import {
  nextResetAt,
  protectedResetUsers,
} from "../src/server/lib/reset-policy";

void test("missing, empty, or partially invalid protection disables all resets", () => {
  for (const value of [
    undefined,
    "",
    " ",
    "user_owner,",
    "owner@example.com",
    "user_owner,user_",
  ]) {
    assert.equal(protectedResetUsers(value), null);
  }
});

void test("protection accepts multiple exact IDs and removes duplicates", () => {
  assert.deepEqual(
    protectedResetUsers(" user_owner, user_friend,user_owner "),
    ["user_owner", "user_friend"],
  );
});

void test("cycles use 14 elapsed days across month, year and daylight-saving boundaries", () => {
  for (const date of [
    "2026-12-25T04:00:00Z",
    "2028-02-20T04:00:00Z",
    "2026-03-01T04:00:00Z",
  ]) {
    const start = new Date(date);
    const due = nextResetAt(start);
    assert.equal(due.getTime() - start.getTime(), 14 * 86400000);
    assert.equal(start.toISOString(), new Date(date).toISOString());
  }
});

void test("a completed reset grants a fresh cycle instead of reusing the first login", () => {
  const firstLogin = new Date("2026-10-01T00:00:00Z");
  const actualReset = new Date("2026-10-19T04:00:00Z");
  assert.equal(
    nextResetAt(firstLogin).toISOString(),
    "2026-10-15T00:00:00.000Z",
  );
  assert.equal(
    nextResetAt(actualReset).toISOString(),
    "2026-11-02T04:00:00.000Z",
  );
});
