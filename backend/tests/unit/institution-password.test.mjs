import test from "node:test";
import assert from "node:assert/strict";
import { getInstitutionDefaultPassword } from "../../src/config/institution-password.ts";

test("institution password prefers DEMO_PASSWORD and trims/falls back safely", () => {
  const demo = process.env.DEMO_PASSWORD;
  const institution = process.env.INSTITUTION_DEFAULT_PASSWORD;
  try {
    delete process.env.DEMO_PASSWORD;
    delete process.env.INSTITUTION_DEFAULT_PASSWORD;
    assert.throws(getInstitutionDefaultPassword, /Configure DEMO_PASSWORD/);

    process.env.INSTITUTION_DEFAULT_PASSWORD = "  Institucional-123  ";
    assert.equal(getInstitutionDefaultPassword(), "Institucional-123");
    process.env.DEMO_PASSWORD = "  Demo-456  ";
    assert.equal(getInstitutionDefaultPassword(), "Demo-456");
    process.env.DEMO_PASSWORD = "   ";
    assert.equal(getInstitutionDefaultPassword(), "Institucional-123");
  } finally {
    if (demo === undefined) delete process.env.DEMO_PASSWORD;
    else process.env.DEMO_PASSWORD = demo;
    if (institution === undefined) delete process.env.INSTITUTION_DEFAULT_PASSWORD;
    else process.env.INSTITUTION_DEFAULT_PASSWORD = institution;
  }
});
