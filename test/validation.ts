import { assert } from "chai";

import { Form, field } from "../src/index";
import { inRange } from "../src/validators";

class CustomFormWithValidate extends Form {
  constructor(private shouldAddToValidation = true) { super(); }

  @field("Field")
  public f1 = "";

  onValidate(adder) {
    if (this.shouldAddToValidation) {
      adder("custom message");
      adder("f1", "f1 message");
    }
  }
}

describe("validation", () => {
  describe("forms", () => {
    it("should call custom validation when present", () => {
      const instance = new CustomFormWithValidate();

      let didThrow = false;

      try {
        instance.validate();
      } catch(err) {
        didThrow = true;
      }

      assert.isTrue(didThrow, "should throw after calling validate");

      assert(instance.validationMessages.length == 1, "did not add to validationMessages");
      assert(instance.validation["f1"] == "f1 message", "did not add to validation.f1");
    });

    it("should not throw when it didn't call adder", () => {
      const instance = new CustomFormWithValidate(false);

      let didThrow = false;

      try {
        instance.validate();
      } catch(err) {
        didThrow = true;
      }

      assert.isFalse(didThrow, "should not throw after calling validate");
    });
  });

  describe("inRange", () => {
    it("should not validate bad input", () => {
      assert.isNull(inRange(0, 100)("zabc"));
    });
    it("should validate min", () => {
      assert.isNull(inRange(0, null)("1"));
      assert.isNotNull(inRange(0, null)("-1"));
    });
    it("should validate max", () => {
      assert.isNull(inRange(null, 100)("50"));
      assert.isNotNull(inRange(null, 100)("101"));
    });
    it("should validate min and max", () => {
      assert.isNull(inRange(0,100)("50"));
      assert.isNotNull(inRange(0,100)("-1"));
      assert.isNotNull(inRange(0, 100)("101"));
    });
  });
});
