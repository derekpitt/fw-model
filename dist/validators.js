"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
var trimInput = function trimInput(input) {
    if (input != null && input.trim && typeof input.trim == "function") return input.trim();
    return input;
};
var required = function required(input) {
    if (input == null || input.length == 0) return "Required";
    var hasValue = input.toString().replace(/^\s+/, "").replace(/\s+$/, "").length > 0;
    return hasValue ? null : "Required";
};
exports.required = required;
var emailRegEx = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@((?=[a-z0-9-]{1,63}\.)(xn--)?[a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,63}$/i;
var isEmail = function isEmail(input) {
    if (input == null || input.length == 0) return null;
    input = trimInput(input);
    return emailRegEx.test(input) ? null : "Not a valid Email Address";
};
exports.isEmail = isEmail;
var isNumber = function isNumber(input) {
    if (input == null || input.length == 0) return null;
    input = trimInput(input);
    var isNumeric = !isNaN(input - parseFloat(input));
    return isNumeric ? null : "Not a valid number";
};
exports.isNumber = isNumber;
var isInteger = function isInteger(input) {
    if (input == null || input.length == 0) return null;
    input = trimInput(input);
    var isInt = parseFloat(input) - parseInt(input) === 0;
    return isInt ? null : "Not a valid integer";
};
exports.isInteger = isInteger;
var inRange = function inRange(min, max) {
    return function (input) {
        if (input == null || input.length == 0) return null;
        input = trimInput(input);
        var num = parseFloat(input);
        if (isNumber(input) != null) return null;
        if (min != null && max != null) {
            return num >= min && num <= max ? null : "Must be between " + min + " and " + max;
        } else if (min != null) {
            return num >= min ? null : "Must be at least " + min;
        } else if (max != null) {
            return num <= max ? null : "Must be at most " + max;
        } else {
            return null;
        }
    };
};
exports.inRange = inRange;
// this setup acts like a hostname validation
var defaultUrlOptions = {
    allowedProtocols: [],
    requireProtocol: false,
    allowPath: false,
    allowPort: false
};
var isUrl = function isUrl() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? defaultUrlOptions : arguments[0];

    var opts = Object.assign({}, defaultUrlOptions, options);
    // hostname regex
    var regExStr = "(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\\-]*[a-zA-Z0-9])\\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\\-]*[A-Za-z0-9])";
    var protocolRegex = "";
    if (opts.allowedProtocols != null && opts.allowedProtocols.length > 0) {
        var withSlashes = opts.allowedProtocols.map(function (p) {
            if (p.endsWith("://")) return p;
            return p + "://";
        });
        protocolRegex = "(" + withSlashes.join("|") + ")";
    }
    if (!opts.requireProtocol && protocolRegex.length > 0) {
        protocolRegex += "?";
    }
    // Path
    var pathRegex = "";
    if (opts.allowPath) {
        pathRegex = "(/.*)?";
    }
    // Port
    var portRegex = "";
    if (opts.allowPort) {
        portRegex = "(:\\d+)?";
    }
    var tldRegex = "(\\.[a-zA-Z]{2,6})";
    var s = "^" + protocolRegex + regExStr + tldRegex + portRegex + pathRegex + "$";
    var regEx = new RegExp(s);
    return function (input) {
        console.log(s);
        if (input == null || input.length == 0) return null;
        input = trimInput(input);
        return regEx.test(input) ? null : "Not Valid";
    };
};
exports.isUrl = isUrl;
var isMinLength = function isMinLength(num) {
    return function (input) {
        if (input == null || input.length == 0) return null;
        input = trimInput(input);
        return input.length >= num ? null : "Must be at least " + num + " characters";
    };
};
exports.isMinLength = isMinLength;
var isChecked = function isChecked(input) {
    if (input == null) return null;
    return input === true ? null : "Required";
};
exports.isChecked = isChecked;
// wrap can take in simple validators and convert them to validation builder
var wrap = function wrap() {
    for (var _len = arguments.length, validators = Array(_len), _key = 0; _key < _len; _key++) {
        validators[_key] = arguments[_key];
    }

    return function (b) {
        return b.use.apply(b, validators);
    };
};
exports.wrap = wrap;