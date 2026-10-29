import assert from "node:assert/strict";
import { test } from "node:test";
import {
  demoResetProtectedUsers,
  nextResetAt,
  protectedResetUsers,
  resetCycleAction,
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

void test("ordinary visits do not extend an active cycle", () => {
  const cycle = {
    nextResetAt: new Date("2026-10-15T00:00:00Z"),
    lastResetAt: null,
  };
  assert.equal(
    resetCycleAction(cycle, new Date("2026-10-14T23:59:59.999Z")),
    "continue",
  );
  assert.equal(cycle.nextResetAt.toISOString(), "2026-10-15T00:00:00.000Z");
});

void test("returning at or after the deadline resets old data before a fresh cycle", () => {
  const deadline = new Date("2026-10-15T00:00:00Z");
  const cycle = { nextResetAt: deadline, lastResetAt: null };
  assert.equal(resetCycleAction(cycle, deadline), "reset");
  const returnDate = new Date("2026-11-20T04:00:00Z");
  assert.equal(resetCycleAction(cycle, returnDate), "reset");
  assert.equal(
    nextResetAt(returnDate).toISOString(),
    "2026-12-04T04:00:00.000Z",
  );
});

void test("offline cleanup pauses the deadline until the user returns", () => {
  const cycle = {
    nextResetAt: null,
    lastResetAt: new Date("2026-10-19T04:00:00Z"),
  };
  const returnDate = new Date("2026-12-20T04:00:00Z");
  assert.equal(resetCycleAction(cycle, returnDate), "start");
  assert.equal(
    nextResetAt(returnDate).toISOString(),
    "2027-01-03T04:00:00.000Z",
  );
});

void test("an old scheduled task must leave the returning user's new cycle alone", () => {
  const returnedAt = new Date("2026-11-20T04:00:00Z");
  const resumed = {
    nextResetAt: nextResetAt(returnedAt),
    lastResetAt: returnedAt,
  };
  assert.equal(
    resetCycleAction(resumed, new Date("2026-11-23T04:00:00Z")),
    "continue",
  );
});

void test("disabled resets stay disabled even with a valid protection list", () => {
  for (const enabled of [undefined, "false", "", "TRUE"]) {
    assert.equal(demoResetProtectedUsers(enabled, "user_owner"), null);
  }
  assert.deepEqual(demoResetProtectedUsers("true", "user_owner"), [
    "user_owner",
  ]);
  assert.equal(demoResetProtectedUsers("true", undefined), null);
});
