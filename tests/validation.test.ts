import test from "node:test";
import assert from "node:assert/strict";
import { cleanText, validEmail, validOrientation, validProductId, validSessionId } from "../lib/validation";

test("validSessionId accepts expected id", () => {
  assert.equal(validSessionId("a1234567-b123-4567-c123-abcdef123456"), "a1234567-b123-4567-c123-abcdef123456");
});

test("validSessionId rejects traversal-like value", () => {
  assert.equal(validSessionId("../../etc/passwd"), null);
});

test("cleanText trims and collapses whitespace", () => {
  assert.equal(cleanText("  hello   world  "), "hello world");
});

test("validEmail enforces basic shape", () => {
  assert.equal(validEmail("person@example.com"), true);
  assert.equal(validEmail("person@bad"), false);
});

test("validProductId allows only supported products", () => {
  assert.equal(validProductId("glass_plaque"), true);
  assert.equal(validProductId("custom_box"), false);
});

test("validOrientation defaults to portrait", () => {
  assert.equal(validOrientation("landscape"), "landscape");
  assert.equal(validOrientation("sideways"), "portrait");
});
