"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _get = function get(_x6, _x7, _x8) { var _again = true; _function: while (_again) { var object = _x6, property = _x7, receiver = _x8; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x6 = parent; _x7 = property; _x8 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

exports.fromClass = fromClass;
exports.fromClassArray = fromClassArray;
exports.fromPropertyClass = fromPropertyClass;
exports.fromCustom = fromCustom;
exports.createFromProperties = createFromProperties;
exports.createFromArray = createFromArray;
exports.createFrom = createFrom;
exports.field = field;
exports.getFields = getFields;
exports.validateModel = validateModel;
exports.cloneOf = cloneOf;
exports.nameOf = nameOf;
exports.formFor = formFor;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _validators = require("./validators");

var importedValidators = _interopRequireWildcard(_validators);

var Custom = function Custom(cb) {
    _classCallCheck(this, Custom);

    this.cb = cb;
};

function setKeyType(target, key, type) {
    var isArray = arguments.length <= 3 || arguments[3] === undefined ? false : arguments[3];
    var isProperty = arguments.length <= 4 || arguments[4] === undefined ? false : arguments[4];

    var keyTypes = Reflect.getMetadata("model:keyTypes", target.constructor) || [];
    keyTypes.push({ key: key, type: type, isArray: isArray, isProperty: isProperty });
    Reflect.defineMetadata("model:keyTypes", keyTypes, target.constructor);
}
var typeUndefinedErrorMessage = "passed in type is undefined. is it defined above the calling class?";

function fromClass(target, key, descriptor) {
    var classType = Reflect.getMetadata("design:type", target, key);
    if (classType === undefined) {
        console.error("fromClass", typeUndefinedErrorMessage);
        return;
    }
    setKeyType(target, key, classType);
}

function fromClassArray(arrayType) {
    if (arrayType === undefined) {
        console.error("fromClassArray", typeUndefinedErrorMessage);
        return;
    }
    return function (target, key, descriptor) {
        setKeyType(target, key, arrayType, true);
    };
}

function fromPropertyClass(propertyClass) {
    if (propertyClass === undefined) {
        console.error("fromPropertyClass", typeUndefinedErrorMessage);
        return;
    }
    return function (target, key, descriptor) {
        setKeyType(target, key, propertyClass, false, true);
    };
}

function fromCustom(customFunction) {
    return function (target, key, descriptor) {
        setKeyType(target, key, new Custom(customFunction));
    };
}

function createFromProperties(cl, data) {
    var instance = {};
    Object.keys(data).forEach(function (dk) {
        return instance[dk] = createFrom(cl, data[dk]);
    });
    return instance;
}

function createFromArray(cl, data) {
    return data.map(function (d) {
        return createFrom(cl, d);
    });
}

function createFrom(cl, data) {
    var parent = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

    if (cl instanceof Custom) return cl.cb(data, parent);
    var instance = new (Function.prototype.bind.apply(cl, []))();
    Object.assign(instance, data);
    var keyTypes = Reflect.getMetadata("model:keyTypes", cl);
    if (keyTypes) {
        keyTypes.forEach(function (kt) {
            if (data == null) return;
            if (kt.isArray) {
                instance[kt.key] = [];
                if (data[kt.key]) {
                    data[kt.key].forEach(function (d) {
                        instance[kt.key].push(createFrom(kt.type, d, instance));
                    });
                }
            } else if (kt.isProperty) {
                instance[kt.key] = {};
                if (data[kt.key]) {
                    Object.keys(data[kt.key]).forEach(function (dk) {
                        instance[kt.key][dk] = createFrom(kt.type, data[kt.key][dk], instance);
                    });
                }
            } else {
                instance[kt.key] = createFrom(kt.type, data[kt.key], instance);
            }
        });
    }
    return instance;
}

var FieldType;
exports.FieldType = FieldType;
(function (FieldType) {
    FieldType[FieldType["Field"] = 0] = "Field";
    FieldType[FieldType["Form"] = 1] = "Form";
    FieldType[FieldType["FormArray"] = 2] = "FormArray";
    FieldType[FieldType["FormProperty"] = 3] = "FormProperty";
})(FieldType || (exports.FieldType = FieldType = {}));

function field(friendly) {
    for (var _len = arguments.length, validators = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        validators[_key - 1] = arguments[_key];
    }

    return function (target, key) {
        var fields = getFields(target);
        fields.push({
            friendly: friendly,
            key: key,
            validators: validators,
            fieldType: FieldType.Field,
            formCreator: null
        });
        Reflect.defineMetadata("model:fields", fields, target.constructor);
    };
}

function getFields(target) {
    return Reflect.getMetadata("model:fields", target.constructor) || [];
}

function validateModel(model, fields, settings) {
    var result = [];
    fields.forEach(function (f) {
        var value = model[f.key];
        if (f.validators) {
            for (var i = 0; i < f.validators.length; i++) {
                var message = f.validators[i].apply(null, [value, model, settings]);
                if (message != null) {
                    result.push({ message: message, field: f.key });
                    // only take the first one
                    break;
                }
            }
        }
    });
    return result;
}

var Form = (function () {
    function Form() {
        var _this = this;

        var data = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];
        var fields = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

        _classCallCheck(this, Form);

        this.validationMessages = [];
        this.validation = {};
        this.isInvalid = false;
        this._fields = [];
        if (data) Object.assign(this, data);
        if (fields == null) this._fields = getFields(this);else this._fields = fields;
        this._fields.forEach(function (f) {
            return _this.validation[f.key] = "";
        });
    }

    _createClass(Form, [{
        key: "getFieldName",
        value: function getFieldName(field) {
            var f = this._fields.find(function (ff) {
                return ff.key == field;
            });
            return f ? f.friendly : field;
        }

        // returns true if valid
    }, {
        key: "validate",
        value: function validate(settings) {
            var _this2 = this;

            this.clearValidation();
            var results = validateModel(this, this._fields, settings);
            var shouldThrow = false;
            if (results.length > 0) {
                results.forEach(function (v) {
                    return _this2.validation[v.field] = v.message;
                });
                shouldThrow = true;
            }
            var onValidator = this.onValidate;
            if (onValidator && typeof onValidator == "function") {
                var adder = function adder(messageOrField, message) {
                    if (message != undefined) {
                        _this2.validation[messageOrField] = message;
                    } else {
                        _this2.validationMessages.push(messageOrField);
                    }
                    shouldThrow = true;
                };
                onValidator.call(this, adder);
            }
            if (shouldThrow) {
                this.isInvalid = true;
                throw new Error("Not Valid");
            }
        }
    }, {
        key: "clearValidation",
        value: function clearValidation() {
            this.isInvalid = false;
            for (var k in this.validation) {
                this.validation[k] = "";
            }
            this.validationMessages = [];
        }
    }, {
        key: "copyFields",
        value: function copyFields(src) {
            var _this3 = this;

            if (src == null) return;
            this._fields.forEach(function (f) {
                _this3[f.key] = src[f.key] != null ? src[f.key] : _this3[f.key];
            });
        }
    }]);

    return Form;
})();

exports.Form = Form;

function cloneOf(modelType, instance) {
    var clonedJson = JSON.parse(JSON.stringify(instance));
    return createFrom(modelType, clonedJson);
}

// this may need to be hardened for minification... we'll see
var getFieldNameRegEx = new RegExp("(?:return|=>)([^;}]*)");

function nameOf(expr) {
    var res = getFieldNameRegEx.exec(expr.toString());
    if (res == null) throw new Error("Could not get field name");
    // this is limited to actual objects top level properties...
    // not sure if we will have a need to go deep??
    // i guess we will find out :)
    return res[1].split(".")[1].trim();
}

var ModeledFormSetup = (function () {
    function ModeledFormSetup() {
        _classCallCheck(this, ModeledFormSetup);

        this._fields = [];
    }

    _createClass(ModeledFormSetup, [{
        key: "field",
        value: function field(fs, friendly) {
            for (var _len2 = arguments.length, validators = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
                validators[_key2 - 2] = arguments[_key2];
            }

            this._fields.push({
                friendly: friendly,
                validators: validators,
                key: nameOf(fs),
                fieldType: FieldType.Field,
                formCreator: null
            });
        }
    }, {
        key: "form",
        value: function form(fs, friendly, formCreator) {
            this._fields.push({
                friendly: friendly,
                validators: [],
                key: nameOf(fs),
                fieldType: FieldType.Form,
                formCreator: formCreator
            });
        }
    }, {
        key: "formArray",
        value: function formArray(fs, friendly, formCreator) {
            this._fields.push({
                friendly: friendly,
                validators: [],
                key: nameOf(fs),
                fieldType: FieldType.FormArray,
                formCreator: formCreator
            });
        }
    }, {
        key: "formProperty",
        value: function formProperty(fs, friendly, formCreator) {
            this._fields.push({
                friendly: friendly,
                validators: [],
                key: nameOf(fs),
                fieldType: FieldType.FormProperty,
                formCreator: formCreator
            });
        }
    }, {
        key: "getFields",
        value: function getFields() {
            return this._fields;
        }
    }]);

    return ModeledFormSetup;
})();

exports.ModeledFormSetup = ModeledFormSetup;

var _applyModel = function _applyModel(t, applyTo, newModel, fields) {
    var cloneOfThing = cloneOf(t, newModel);
    Object.assign(applyTo, cloneOfThing);
    // do the forms
    var forms = fields.filter(function (f) {
        return f.fieldType == FieldType.Form;
    });
    forms.forEach(function (form) {
        applyTo[form.key] = form.formCreator(cloneOfThing[form.key] || null);
    });
    // do the forms arrays
    var formArrays = fields.filter(function (f) {
        return f.fieldType == FieldType.FormArray;
    });
    formArrays.forEach(function (formArray) {
        applyTo[formArray.key] = [];
        if (Array.isArray(cloneOfThing[formArray.key])) {
            cloneOfThing[formArray.key].forEach(function (d) {
                applyTo[formArray.key].push(formArray.formCreator(d));
            });
        }
    });
    var formProperties = fields.filter(function (f) {
        return f.fieldType == FieldType.FormProperty;
    });
    formProperties.forEach(function (formArray) {
        applyTo[formArray.key] = {};
        if (cloneOfThing[formArray.key] == null) return;
        for (var key in cloneOfThing[formArray.key]) {
            applyTo[formArray.key][key] = formArray.formCreator(cloneOfThing[formArray.key][key]);
        }
    });
};

var FormAsModel = (function (_Form) {
    _inherits(FormAsModel, _Form);

    function FormAsModel(fields, _t, _orig) {
        _classCallCheck(this, FormAsModel);

        _get(Object.getPrototypeOf(FormAsModel.prototype), "constructor", this).call(this, undefined, fields);
        this._t = _t;
        this._orig = _orig;
    }

    _createClass(FormAsModel, [{
        key: "applyModel",
        value: function applyModel(newModel) {
            this.clearValidation();
            _applyModel(this._t, this, newModel, this._fields);
        }

        // formArray fields could be weird in this if the models arew out of sync..
        // if you do ever call this yourself, make sure
        // that items haven't been moved around
    }, {
        key: "copyValidation",
        value: function copyValidation(fasm) {
            var _this4 = this;

            if (fasm == null) return;
            this.validationMessages = fasm.validationMessages;
            this._fields.forEach(function (f) {
                return _this4.validation[f.key] = fasm.validation[f.key];
            });
            var forms = this._fields.filter(function (f) {
                return f.fieldType == FieldType.Form;
            });
            forms.forEach(function (f) {
                if (_this4[f.key] == null || fasm[f.key] == null) return;
                _this4[f.key].copyValidation(fasm[f.key]);
            });
            var formArrays = this._fields.filter(function (f) {
                return f.fieldType == FieldType.FormArray;
            });
            formArrays.forEach(function (f) {
                _this4[f.key].forEach(function (d, idx) {
                    if (fasm[f.key] == null || fasm[f.key][idx] == null) return;
                    d.copyValidation(fasm[f.key][idx]);
                });
            });
            var formProperties = this._fields.filter(function (f) {
                return f.fieldType == FieldType.FormProperty;
            });
            formProperties.forEach(function (f) {
                if (_this4[f.key] == null || fasm[f.key] == null) return;
                for (var key in _this4[f.key]) {
                    if (fasm[f.key][key] == null) continue;
                    _this4[f.key][key].copyValidation(fasm[f.key][key]);
                }
            });
        }
    }, {
        key: "updatedModel",
        value: function updatedModel() {
            var _this5 = this;

            var data = cloneOf(this._t, this._orig);
            this._fields.forEach(function (f) {
                data[f.key] = _this5[f.key];
            });
            var forms = this._fields.filter(function (f) {
                return f.fieldType == FieldType.Form;
            });
            forms.forEach(function (f) {
                if (_this5[f.key] == null) return;
                data[f.key] = _this5[f.key].updatedModel();
            });
            var formArrays = this._fields.filter(function (f) {
                return f.fieldType == FieldType.FormArray;
            });
            formArrays.forEach(function (f) {
                data[f.key] = [];
                _this5[f.key].forEach(function (d) {
                    if (d == null) return;
                    data[f.key].push(d.updatedModel());
                });
            });
            var formProperties = this._fields.filter(function (f) {
                return f.fieldType == FieldType.FormProperty;
            });
            formProperties.forEach(function (f) {
                data[f.key] = {};
                for (var key in _this5[f.key]) {
                    if (_this5[f.key][key] == null) continue;
                    data[f.key][key] = _this5[f.key][key].updatedModel();
                }
            });
            return data;
        }
    }, {
        key: "validate",
        value: function validate(settings) {
            var _this6 = this;

            var shouldThrow = false;
            try {
                _get(Object.getPrototypeOf(FormAsModel.prototype), "validate", this).call(this, settings);
            } catch (err) {
                shouldThrow = true;
            }
            var forms = this._fields.filter(function (f) {
                return f.fieldType == FieldType.Form;
            });
            forms.forEach(function (f) {
                try {
                    if (_this6[f.key] == null) return;
                    _this6[f.key].validate(settings);
                } catch (err) {
                    shouldThrow = true;
                }
            });
            var formArrays = this._fields.filter(function (f) {
                return f.fieldType == FieldType.FormArray;
            });
            formArrays.forEach(function (f) {
                _this6[f.key].forEach(function (d) {
                    try {
                        if (d == null) return;
                        d.validate(settings);
                    } catch (err) {
                        shouldThrow = true;
                    }
                });
            });
            var formProperties = this._fields.filter(function (f) {
                return f.fieldType == FieldType.FormProperty;
            });
            formProperties.forEach(function (f) {
                for (var key in _this6[f.key]) {
                    try {
                        if (_this6[f.key][key] == null) continue;
                        _this6[f.key][key].validate(settings);
                    } catch (err) {
                        shouldThrow = true;
                    }
                }
            });
            if (shouldThrow) {
                this.isInvalid = true;
                throw new Error("Not Valid");
            }
        }
    }]);

    return FormAsModel;
})(Form);

exports.FormAsModel = FormAsModel;

function formFor(t, setup) {
    return function (thing) {
        var oldForm = null;
        if (thing instanceof FormAsModel) {
            //throw new Error("Should not pass an instance of a form to a creator");
            // updated model, and also
            oldForm = thing;
            thing = thing.updatedModel();
        }
        var mfSetup = new ModeledFormSetup();
        setup(mfSetup);
        var fields = mfSetup.getFields();
        var fasm = new FormAsModel(fields, t, thing);
        _applyModel(t, fasm, thing, fields);
        if (oldForm != null) fasm.copyValidation(oldForm);
        return fasm;
    };
}

var Validators = importedValidators;
exports.Validators = Validators;