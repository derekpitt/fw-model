import { assert } from "chai";

import { Form, field } from "../src/index";
import { inRange, isEmail, isInteger, isMinLength, isNumber, isUrl, doesNotContainCharacters } from "../src/validators";

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

      assert.throws(() => instance.validate());

      assert(instance.validationMessages.length == 1, "did not add to validationMessages");
      assert(instance.validation["f1"] == "f1 message", "did not add to validation.f1");
    });

    it("should not throw when it didn't call adder", () => {
      const instance = new CustomFormWithValidate(false);
      assert.doesNotThrow(() => instance.validate(), "should not throw after calling validate");
    });

    it("should trim whitespaces before running validation", () => {
      assert.isNull(isEmail('email@address.tld '));
      assert.isNull(isUrl()('www.domain.tld '));
      assert.isNull(isMinLength(3)('abc '));
      assert.isNotNull(isMinLength(3)('ab '));
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

  describe("doesNotContainCharacters validator", () => {
    let validator;

    beforeEach(() => {
      validator = doesNotContainCharacters('z');
    });

    describe("when the input contains the forbidden character", () => {
      it("should not validate the value", () => {
        assert.isNotNull(validator('hello worldz!'));
      });
    });

    describe("when the input does not contain the forbidden character", () => {
      it("should validate the value", () => {
        assert.isNull(validator('hello world'));
      });
    });
  });

  describe("isUrl", () => {
    it("should validate as a hostname when no options", () => {
      assert.isNull(isUrl()('example.com'));
      assert.isNotNull(isUrl()('^'));
      assert.isNotNull(isUrl()('example.com/'));
      assert.isNotNull(isUrl()('http://example.com'));
    });

    it("should validate with protocol options", () => {
      assert.isNull(isUrl({ allowedProtocols: [ "http" ], requireProtocol: true })("http://example.com"));
      assert.isNull(isUrl({ allowedProtocols: [ "http" ], requireProtocol: true })("http://example.com"));
      assert.isNull(isUrl({ allowedProtocols: [ "http" ], requireProtocol: false })("http://example.com"));
      assert.isNotNull(isUrl({ allowedProtocols: [ "http" ], requireProtocol: true })("example.com"));

      assert.isNull(isUrl({ allowedProtocols: [ "http" ], requireProtocol: true })("http://example.com"));
      assert.isNull(isUrl({ allowedProtocols: [ "http" ], requireProtocol: false })("http://example.com"));

      assert.isNotNull(isUrl({ allowedProtocols: [ "https" ], requireProtocol: true })("http://example.com"));
      assert.isNotNull(isUrl({ allowedProtocols: [ "https" ], requireProtocol: false })("http://example.com"));
      assert.isNull(isUrl({ allowedProtocols: [ "https" ], requireProtocol: true })("https://example.com"));
      assert.isNull(isUrl({ allowedProtocols: [ "https" ], requireProtocol: false })("https://example.com"));

      assert.isNull(isUrl({ allowedProtocols: [ "https", "ftp" ], requireProtocol: true })("ftp://example.com"));
      assert.isNull(isUrl({ allowedProtocols: [ "https", "ftp" ], requireProtocol: false })("ftp://example.com"));
    });

    describe("when allowedProtocols option is set", () => {
      it("should invalidate a url without an allowed protocol", () => {
        assert.isNotNull(isUrl({ allowedProtocols: [ "http", "https" ], allowPath: true, allowPort: true })("ftp://invalid-url"));
      });
      it("should validate a url with a protocol", () => {
        assert.isNull(isUrl({ allowedProtocols: [ "http", "https" ], allowPath: true, allowPort: true })("http://invalid-url"));
      });
      it("should validate with allowedProtocols when the url is valid but no protocol", () => {
        assert.isNull(isUrl({ allowedProtocols: [ "http", "https" ], allowPath: true, allowPort: true })("valid-url-no-protocol.tld"));
      });
    });

    describe("when requireTld option is set to true", () => {
      it("should validate a URL with a tld", () => {
        assert.isNull(isUrl({ requireTld: true })("example.com"));
      });
      it("should validate a URL with a tld and a protocol", () => {
        assert.isNull(isUrl({ allowedProtocols: [ "http", "https" ], requireTld: true })("http://example.com"));
      });
      it("should validate a URL with a tld, a protocol & a path", () => {
        assert.isNull(isUrl({ allowedProtocols: [ "http", "https" ], allowPath: true, requireTld: true })("http://example.com/path/here/to/somewhere"));
      });
      it("should validate a URL with a tld, a protocol, a path & a port", () => {
        assert.isNull(isUrl({ allowedProtocols: [ "http", "https" ], allowPath: true, allowPort: true, requireTld: true })("http://example.com:8000/path/here/to/somewhere"));
      });

      it("should invalidate a URL without a tld", () => {
        assert.isNotNull(isUrl({ requireTld: true })("example"));
      });
      it("should invalidate a URL without a tld but with a protocol", () => {
        assert.isNotNull(isUrl({ allowedProtocols: [ "http", "https" ], requireTld: true })("http://example"));
      });
      it("should invalidate a URL without a tld but with a protocol & a path", () => {
        assert.isNotNull(isUrl({ allowedProtocols: [ "http", "https" ], allowPath: true, requireTld: true })("http://example/path/here/to/somewhere"));
      });
      it("should invalidate a URL without a tld but with a protocol, a path & a port", () => {
        assert.isNotNull(isUrl({ allowedProtocols: [ "http", "https" ], allowPath: true, allowPort: true, requireTld: true })("http://example:8000/path/here/to/somewhere"));
      });
    });

    it("should validate with path options", () => {
      assert.isNull(isUrl({ allowPath: true })("example.com"));
      assert.isNull(isUrl({ allowPath: true })("example.com/"));
      assert.isNull(isUrl({ allowPath: true })("example.com/hey"));
      assert.isNull(isUrl({ allowPath: true })("example.com/hey.html"));
      assert.isNull(isUrl({ allowPath: true })("example.com/?foo=bar#qaz"));
      assert.isNull(isUrl({ allowedProtocols: [ "http" ], allowPath: true })("http://example.com/?foo=bar#qaz"));

      assert.isNotNull(isUrl({ allowPath: false })("example.com/hey"));
    });

    it("should validate with port options", () => {
      assert.isNull(isUrl({ allowPort: true })("example.com:123"));

      assert.isNotNull(isUrl({ allowPort: false })("example.com:123"));
    });
  });
});
