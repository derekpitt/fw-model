import { assert } from "chai";

import { Form, field } from "../src/index";
import { inRange, isEmail, isInteger, isLength, isMinLength, isNumber, isUrl } from "../src/validators";

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

    it("should trim whitespaces before running validation", () => {
      assert.isNull(isEmail('email@address.tld '));
      assert.isNull(isUrl()('http://www.domain.tld '));
      assert.isNull(isMinLength(3)('abc '));
      assert.isNotNull(isMinLength(3)('ab '));
      assert.isNull(isLength(3)('abc '));
      assert.isNull(inRange(1,4)('3 '));
      assert.isNull(isInteger('3 '));
      assert.isNull(isNumber('3 '));
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

  describe("isUrl", () => {
    it("should validate a simple URL", () => {
      assert.isNull(isUrl()('example.com'));
    });
    it("should validate a URL without protocol", () => {
      assert.isNull(isUrl()('www.example.com'));
    });
    it("should validate a URL with http protocol", () => {
      assert.isNull(isUrl()('http://www.example.com'));
    });
    it("shouldn't validate a URL with broken protocol", () => {
      assert.isNotNull(isUrl()('ht://www.example.com'));
    });
    it("should validate a SSL URL", () => {
      assert.isNull(isUrl()('https://www.example.com'));
    });
    it("should enforce a SSL URL", () => {
      assert.isNotNull(isUrl(true)('http://www.example.com'));
    });
    it("should enforce a http protocol", () => {
      assert.isNotNull(isUrl(false, true)('example.com'));
      assert.isNotNull(isUrl(false, true)('www.example.com'));
      assert.isNull(isUrl(false, true)('http://example.com'));
    });
    it("should validate a URL with an ending slash", () => {
      assert.isNull(isUrl()('http://www.example.com/'));
    });
    it("should validate a SSL URL with an ending slash", () => {
      assert.isNull(isUrl(true)('https://www.example.com/'));
    });
    it("should validate a URL with path, fragment & query", () => {
      assert.isNull(isUrl()('http://www.example.com/?foo=bar#quz'));
    });
  });
});
