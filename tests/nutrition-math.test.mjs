import assert from "node:assert/strict";
import { test } from "node:test";
import {
  macrosPlausible,
  mealForHour,
  nameSimilarity,
  normalizeFoodName,
  nutrientFor,
  round1,
} from "../src/features/nutrition/math.ts";

test("protein from quantity and unit", () => {
  assert.equal(round1(nutrientFor(3, 55, 12.6)), 20.8, "3 eggs");
  assert.equal(round1(nutrientFor(150, 1, 22.5)), 33.8, "150 g chicken breast");
  assert.equal(round1(nutrientFor(1.5, 30, 78)), 35.1, "1.5 scoops whey");
});

test("normalize", () => {
  assert.equal(normalizeFoodName("  Telur Ayam (Rebus)! "), "telur ayam rebus");
  assert.equal(normalizeFoodName("Café Latte"), "cafe latte");
  assert.equal(normalizeFoodName("Milk 2%"), "milk 2%");
});

test("similarity catches near duplicates", () => {
  assert.equal(nameSimilarity("Chicken breast", "chicken breast"), 1);
  assert.ok(nameSimilarity("Chicken breast", "Breast, chicken") > 0.9, "word order ignored");
  assert.ok(nameSimilarity("Chiken breast", "Chicken breast") > 0.75, "typo");
  assert.ok(nameSimilarity("Tempe goreng", "Tempeh goreng") > 0.7);
  assert.ok(nameSimilarity("Banana", "Salmon fillet") < 0.3);
});

test("macro sanity", () => {
  assert.equal(macrosPlausible({ protein: 12.6, carbs: 0.7, fat: 9.5, calories: 143 }), null, "egg");
  assert.equal(macrosPlausible({ protein: 78, carbs: 8, fat: 5, calories: 380 }), null, "whey");
  assert.ok(macrosPlausible({ protein: 80, carbs: 30, fat: 10, calories: null }), "over 100 g");
  assert.ok(macrosPlausible({ protein: 60, carbs: 0, fat: 0, calories: 100 }), "macros exceed calories");
  assert.equal(macrosPlausible({ protein: 20, carbs: null, fat: null, calories: null }), null);
});

test("meal by hour", () => {
  assert.equal(mealForHour(7), "breakfast");
  assert.equal(mealForHour(12), "lunch");
  assert.equal(mealForHour(19), "dinner");
  assert.equal(mealForHour(23), "snack");
  assert.equal(mealForHour(2), "snack");
});
