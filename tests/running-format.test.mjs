import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatClock,
  formatKm,
  formatPace,
  paceSecondsPerKm,
  parseDurationInput,
  parseKmInput,
  plausiblePace,
} from "../src/features/running/format.ts";

test("pace", () => {
  assert.equal(formatPace(paceSecondsPerKm(1710, 5000)), "5:42");
  assert.equal(formatPace(paceSecondsPerKm(3600, 10000)), "6:00");
  assert.equal(formatPace(0), "—");
});

test("distance input", () => {
  assert.equal(parseKmInput("5"), 5000);
  assert.equal(parseKmInput("5,25"), 5250);
  assert.equal(parseKmInput("21.0975"), null, "max 3 decimals");
  assert.equal(parseKmInput("21.097"), 21097);
  assert.equal(parseKmInput("0"), null);
  assert.equal(parseKmInput("abc"), null);
});

test("duration input", () => {
  assert.equal(parseDurationInput("25:30"), 1530);
  assert.equal(parseDurationInput("1:02:05"), 3725);
  assert.equal(parseDurationInput("45"), 2700, "plain number = minutes");
  assert.equal(parseDurationInput("90:00"), 5400, "mm:ss may exceed 59 minutes");
  assert.equal(parseDurationInput("1:75:00"), null);
  assert.equal(parseDurationInput("25:75"), null);
  assert.equal(parseDurationInput(""), null);
});

test("formatting", () => {
  assert.equal(formatClock(3725), "1:02:05");
  assert.equal(formatClock(1530), "25:30");
  assert.equal(formatKm(5000), "5");
  assert.equal(formatKm(5250), "5.25");
  assert.equal(formatKm(18400), "18.4");
});

test("plausible pace", () => {
  assert.equal(plausiblePace(342), true);
  assert.equal(plausiblePace(60), false);
  assert.equal(plausiblePace(2000), false);
});
