import { assert } from "chai";

import { Form, field } from "../src/index";

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
});
