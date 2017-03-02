"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.required = required;
exports.isEmail = isEmail;
exports.isNumber = isNumber;
exports.isInteger = isInteger;
exports.isUrl = isUrl;
exports.isMinLength = isMinLength;
exports.isChecked = isChecked;

var _templateObject = _taggedTemplateLiteral(["^(https", "://)(www>)?[-a-zA-Z0-9@:%._+~#=]{2,256}>[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)$"], ["^(https", ":\\/\\/)(www>)?[-a-zA-Z0-9@:%._\\+~#=]{2,256}>[a-z]{2,6}\\b([-a-zA-Z0-9@:%_\\+.~#?&\\/\\/=]*)$"]);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

function required(input) {
    if (input == null || input.length == 0) return "Required";
    var hasValue = input.toString().replace(/^\s+/, "").replace(/\s+$/, "").length > 0;
    return hasValue ? null : "Required";
}

var emailRegEx = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@((?=[a-z0-9-]{1,63}\.)(xn--)?[a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,63}$/i;

function isEmail(input) {
    if (input == null || input.length == 0) return null;
    return emailRegEx.test(input) ? null : "Not a valid Email Address";
}

function isNumber(input) {
    if (input == null || input.length == 0) return null;
    var isNumeric = !isNaN(input - parseFloat(input));
    return isNumeric ? null : "Not a valid number";
}

function isInteger(input) {
    if (input == null || input.length == 0) return null;
    var isInt = parseFloat(input) - parseInt(input) === 0;
    return isInt ? null : "Not a valid integer";
}

function isUrl() {
    var enforceSSL = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

    return function (input) {
        if (input == null || input.length == 0) return null;
        var urlRegEx = new RegExp(String.raw(_templateObject, enforceSSL ? '' : '?'));
        return urlRegEx.test(input) ? null : "Not a valid " + (enforceSSL ? 'SSL ' : '') + " URL";
    };
}

function isMinLength(num) {
    return function (input) {
        if (input == null || input.length == 0) return null;
        return input.length >= num ? null : "Must be at least " + num + " characters";
    };
}

function isChecked(input) {
    if (input == null) return null;
    return input === true ? null : "Required";
}