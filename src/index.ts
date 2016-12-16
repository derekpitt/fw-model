export interface makerOf<T> {
  new(...args): T;
}

interface keyType {
  key: string;
  type: any;
  isArray: boolean;
  isProperty: boolean;
}

class Custom {
  constructor(public cb: (data, parent) => any) { }
}

function setKeyType(target, key, type, isArray = false, isProperty = false) {
  const keyTypes: keyType[] = Reflect.get(target.constructor, "model:keyTypes") || [];
  keyTypes.push({ key, type, isArray, isProperty });
  Reflect.set(target.constructor, "model:keyTypes", keyTypes);
}

const typeUndefinedErrorMessage = "passed in type is undefined. is it defined above the calling class?";

export function fromClass(target, key, descriptor?) {
  const classType = (Reflect as any).getMetadata("design:type", target, key);
  if (classType === undefined) {
    console.error("fromClass", typeUndefinedErrorMessage);
    return;
  }

  setKeyType(target, key, classType);
}

export function fromClassArray(arrayType) {
  if (arrayType === undefined) {
    console.error("fromClassArray", typeUndefinedErrorMessage);
    return;
  }

  return function(target, key, descriptor?) {
    setKeyType(target, key, arrayType, true);
  };
}

export function fromPropertyClass(propertyClass) {
  if (propertyClass === undefined) {
    console.error("fromPropertyClass", typeUndefinedErrorMessage);
    return;
  }

  return function(target, key, descriptor?) {
    setKeyType(target, key, propertyClass, false, true);
  };
}

export function fromCustom(customFunction: (data, parent) => any) {
  return function(target, key, descriptor?) {
    setKeyType(target, key, new Custom(customFunction));
  };
}

export function createFromArray<T>(cl: makerOf<T>, data: any[]): T[] {
  return data.map(d => createFrom(cl, d));
}

export function createFrom<T>(cl: makerOf<T>, data: any, parent = null): T {
  if (cl instanceof Custom) return (cl as any).cb(data, parent);

  const instance = new (Function.prototype.bind.apply(cl, []));
  Object.assign(instance, data);

  const keyTypes: keyType[] = Reflect.get(cl, "model:keyTypes");
  if (keyTypes) {
    keyTypes.forEach(kt => {
      if (data == null) return;

      if (kt.isArray) {
        instance[kt.key] = [];

        if (data[kt.key]) {
          data[kt.key].forEach(d => {
            instance[kt.key].push(createFrom(kt.type, d, instance));
          });
        }
      } else if (kt.isProperty) {
        instance[kt.key] = {};
        if (data[kt.key]) {
          Object.keys(data[kt.key]).forEach(dk => {
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

export type Validator = (input: any, model?: any, settings?: any) => string;

export enum FieldType {
  Field,
  Form,
  FormArray,
};

export interface Field {
  friendly: string;
  key: string;
  validators: Validator[];

  fieldType: FieldType;
  formCreator: Function;
}

export function field(friendly: string, ...validators: Validator[]) {
  return function(target, key) {
    const fields: Field[] = Reflect.get(target.constructor, "model:fields") || [];
    fields.push({ friendly, key, validators, fieldType: FieldType.Field, formCreator: null });
    Reflect.set(target.constructor, "model:fields", fields);
  };
}

export function getFields(target): Field[] {
  return Reflect.get(target.constructor, "model:fields") || [];
}

export interface ValidationResult {
  field: string;
  message: string;
}

export function validateModel(model: any, fields: Field[], settings?: any): ValidationResult[] {
  const result: ValidationResult[] = [];

  fields.forEach(f => {
    const value = model[f.key];

    if (f.validators) {
      for (let i = 0; i < f.validators.length; i++) {
        const message = f.validators[i].apply(null, [value, model, settings]);
        if (message != null) {
          result.push({ message, field: f.key });

          // only take the first one
          break;
        }
      }
    }
  });

  return result;
}

export class Form {
  public validationMessages: string[] = [];
  public validation: { [key: string]: string } = {};
  public isInvalid: boolean = false;

	protected _fields: Field[] = [];

  constructor(data = null, fields: Field[] = null) {
    if (data)
      Object.assign(this, data);

		if (fields == null)
			this._fields = getFields(this);
		else
			this._fields = fields;

		this._fields.forEach(f => this.validation[f.key] = "");
  }

  public getFieldName(field: string) {
		const f = this._fields.find(ff => ff.key == field);
		return f ? f.friendly : field;
  }

  // returns true if valid
  public validate(settings?: any) {
    this.clearValidation();

    const results = validateModel(this, this._fields, settings);

    let shouldThrow = false;

    if (results.length > 0) {
      results.forEach(v => this.validation[v.field] = v.message);
      shouldThrow = true;
    }

    const onValidator = (this as any).onValidate;
    if (onValidator && typeof onValidator == 'function') {
      const adder = (messageOrField: string, message?: string) => {
        if (message != undefined) {
          this.validation[messageOrField] = message;
        } else {
          this.validationMessages.push(messageOrField);
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

  public clearValidation() {
    this.isInvalid = false;

    for (let k in this.validation) {
      this.validation[k] = "";
    }

    this.validationMessages = [];
  }

  protected copyFields(src) {
    if (src == null) return;
    this._fields.forEach(f => {
      this[f.key] = src[f.key] != null ? src[f.key] : this[f.key];
    });
  }
}

function cloneOf<T>(modelType: makerOf<T>, instance: T): T {
	const clonedJson = JSON.parse(JSON.stringify(instance));
	return createFrom(modelType, clonedJson);
}

// this may need to be hardened for minification... we'll see
const getFieldNameRegEx = new RegExp("return (.*)[;}]");
function getFieldName<T>(expr: (T) => any): string {
	const res = getFieldNameRegEx.exec(expr.toString());
	if (res == null) throw new Error("Could not get field name");

	// this is limited to actual objects top level properties...
	// not sure if we will have a need to go deep??
	// i guess we will find out :)
	return res[1].split(".")[1].trim();
}

export class ModeledFormSetup<T> {
	private _fields: Field[] = [];

	field(fs: (obj: T) => any, friendly: string, ...validators: Validator[]) {
		this._fields.push({
			friendly,
			validators,
			key: getFieldName(fs),
      fieldType: FieldType.Field,
      formCreator: null,
		});
	}

  form<AnotherT>(fs: (obj: T) => any, friendly: string, formCreator: (thing: AnotherT) => FormForType<AnotherT>) {
		this._fields.push({
			friendly,
			validators: [],
			key: getFieldName(fs),
      fieldType: FieldType.Form,
      formCreator,
		});
  }

  formArray<AnotherT>(fs: (obj: T) => any, friendly: string, formCreator: (thing: AnotherT) => FormForType<AnotherT>) {
		this._fields.push({
			friendly,
			validators: [],
			key: getFieldName(fs),
      fieldType: FieldType.FormArray,
      formCreator,
		});
  }

	getFields(): Field[] {
		return this._fields;
	}
}

export class FormAsModel<ModelT> extends Form {
	constructor(fields: Field[], private _t: makerOf<ModelT>, private _orig: ModelT) {
		super(undefined, fields);
	}

	updatedModel(): ModelT {
		const data = cloneOf(this._t, this._orig);
		this._fields.forEach(f => {
			data[f.key] = this[f.key];
		});

    const forms = this._fields.filter(f => f.fieldType == FieldType.Form);
    forms.forEach(f => {
      if (this[f.key] == null) return;

      data[f.key] = (this[f.key] as FormAsModel<any>).updatedModel();
    });

    const formArrays = this._fields.filter(f => f.fieldType == FieldType.FormArray);
    formArrays.forEach(f => {
      data[f.key] = [];

      this[f.key].forEach(d => {
        if (d == null) return;

        data[f.key].push((d as FormAsModel<any>).updatedModel());
      });
    });

		return data;
	}

  validate(settings?: any) {
    let shouldThrow = false;

    try {
      super.validate(settings);
    } catch(err) {
      shouldThrow = true;
    }

    const forms = this._fields.filter(f => f.fieldType == FieldType.Form);
    forms.forEach(f => {
      try {
        if (this[f.key] == null) return;

        this[f.key].validate(settings);
      } catch(err) {
        shouldThrow = true;
      }
    });

    const formArrays = this._fields.filter(f => f.fieldType == FieldType.FormArray);
    formArrays.forEach(f => {
      this[f.key].forEach(d => {
        try {
          if (d == null) return;

          (d as FormAsModel<any>).validate(settings);
        } catch(err) {
          shouldThrow = true;
        }
      });
    });

    if (shouldThrow) {
      this.isInvalid = true;
      throw new Error("Not Valid");
    }
  }
}

export type FormForType<ModelT> = FormAsModel<ModelT> & ModelT;

export function formFor<ModelT>(t: makerOf<ModelT>, setup: (s: ModeledFormSetup<ModelT>) => void): (thing: ModelT) => FormForType<ModelT> {
	return (thing: ModelT) => {
		const mfSetup = new ModeledFormSetup<ModelT>();
		setup(mfSetup);

    const fields = mfSetup.getFields();
		const fasm = new FormAsModel<ModelT>(fields, t, thing);
		const cloneOfThing = cloneOf(t, thing);

		Object.assign(fasm, cloneOfThing);

    // do the forms
    const forms = fields.filter(f => f.fieldType == FieldType.Form);
    forms.forEach(form => {
      fasm[form.key] = form.formCreator(cloneOfThing[form.key] || null);
    });

    // do the forms arrays
    const formArrays = fields.filter(f => f.fieldType == FieldType.FormArray);
    formArrays.forEach(formArray => {
      fasm[formArray.key] = [];

      if (Array.isArray(cloneOfThing[formArray.key])) {
        cloneOfThing[formArray.key].forEach(d => {
          fasm[formArray.key].push(formArray.formCreator(d));
        });
      }
    });

		return fasm as FormForType<ModelT>;
	}
}

import * as importedValidators from "./validators";
export const Validators = importedValidators;
