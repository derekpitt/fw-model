import { Validator, ValidationBuilder, required } from "./validators";
import 'reflect-metadata';

export interface makerOf<T> {
  new (...args): T;
}

interface keyType {
  key: string;
  type: any;
  isArray: boolean;
  isProperty: boolean;
}

class Custom {
  constructor(public cb: (data, parent) => any) {}
}

function setKeyType(target, key, type, isArray = false, isProperty = false) {
  const keyTypes: keyType[] =
    (Reflect as any).getMetadata("model:keyTypes", target.constructor) || [];
  keyTypes.push({ key, type, isArray, isProperty });
  (Reflect as any).defineMetadata("model:keyTypes", keyTypes, target.constructor);
}

const typeUndefinedErrorMessage =
  "passed in type is undefined. is it defined above the calling class?";

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

export function createFromProperties<T>(
  cl: makerOf<T>,
  data: any,
): { [key: string]: T } {
  const instance: { [key: string]: T } = {};

  Object.keys(data).forEach(dk => (instance[dk] = createFrom(cl, data[dk])));

  return instance;
}

export function createFromArray<T>(cl: makerOf<T>, data: any[]): T[] {
  return data.map(d => createFrom(cl, d));
}

export function createFrom<T>(cl: makerOf<T>, data: any, parent = null): T {
  if (cl instanceof Custom) return (cl as any).cb(data, parent);

  const instance = new (Function.prototype.bind.apply(cl, []))();
  Object.assign(instance, data);

  const keyTypes: keyType[] = (Reflect as any).getMetadata("model:keyTypes", cl);
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
            instance[kt.key][dk] = createFrom(
              kt.type,
              data[kt.key][dk],
              instance,
            );
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
  FormProperty,
}

export type ValidationBuilderArg<T = any> = (builder: ValidationBuilder<T>, model?: T, settings?: any) => void;

export interface Field {
  friendly: string;
  key: string;
  validators: Validator[];
  validatorBuilders?: ValidationBuilderArg[];

  fieldType: FieldType;
  formCreator: Function;
}

export function field(friendly: string, ...validators: Validator[]) {
  return function(target, key) {
    const fields: Field[] = getFields(target);
    fields.push({
      friendly,
      key,
      validators,
      fieldType: FieldType.Field,
      formCreator: null,
    });
    (Reflect as any).defineMetadata("model:fields", fields, target.constructor);
  };
}

export function getFields(target): Field[] {
  return (Reflect as any).getMetadata("model:fields", target.constructor) || [];
}

export interface ValidationResult {
  field: string;
  message: string;
}

export function validateModel(
  model: any,
  fields: Field[],
  settings?: any,
): ValidationResult[] {
  const result: ValidationResult[] = [];

  fields.forEach(f => {
    const value = model[f.key];

    if (f.validatorBuilders && f.validatorBuilders.length > 0) {
      const b = new TheValidationBuilder(value, model, settings, fields);
      for (const vb of f.validatorBuilders) {
        if (vb != null) vb(b, model, settings);
      }

      const message = b.validate();
      if (message != null) {
        result.push({ message, field: f.key });
      }
    } else if (f.validators) {
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
    if (data) Object.assign(this, data);

    if (fields == null) this._fields = getFields(this);
    else this._fields = fields;

    this._fields.forEach(f => (this.validation[f.key] = ""));
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
      results.forEach(v => (this.validation[v.field] = v.message));
      shouldThrow = true;
    }

    const onValidator = (this as any).onValidate;
    if (onValidator && typeof onValidator == "function") {
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

export function cloneOf<T>(modelType: makerOf<T>, instance: T): T {
  const clonedJson = JSON.parse(JSON.stringify(instance));
  return createFrom(modelType, clonedJson);
}

// this may need to be hardened for minification... we'll see
const getFieldNameRegEx = new RegExp("(?:return|=>)([^;}]*)");

export function nameOf<T>(expr: (T) => any): string {
  const res = getFieldNameRegEx.exec(expr.toString());
  if (res == null) throw new Error("Could not get field name");

  // this is limited to actual objects top level properties...
  // not sure if we will have a need to go deep??
  // i guess we will find out :)
  return res[1].split(".")[1].trim();
}

export class ModeledFormSetup<T> {
  private _fields: Field[] = [];

  requiredField(fs: (obj: T) => any, friendly: string, ...builders: ValidationBuilderArg<T>[]) {
    this.field(fs, friendly, b => b.use(required), ...builders);
  }

  field(fs: (obj: T) => any, friendly: string, ...builders: ValidationBuilderArg<T>[]) {
    this._fields.push({
      friendly,
      validators: [],
      validatorBuilders: builders,
      key: nameOf(fs),
      fieldType: FieldType.Field,
      formCreator: null,
    });
  }

  form<AnotherT>(
    fs: (obj: T) => AnotherT,
    friendly: string,
    formCreator: (thing: AnotherT) => FormForType<AnotherT>,
  ) {
    this._fields.push({
      friendly,
      validators: [],
      key: nameOf(fs),
      fieldType: FieldType.Form,
      formCreator,
    });
  }

  formArray<AnotherT>(
    fs: (obj: T) => AnotherT[],
    friendly: string,
    formCreator: (thing: AnotherT) => FormForType<AnotherT>,
  ) {
    this._fields.push({
      friendly,
      validators: [],
      key: nameOf(fs),
      fieldType: FieldType.FormArray,
      formCreator,
    });
  }

  formProperty<AnotherT>(
    fs: (obj: T) => any,
    friendly: string,
    formCreator: (thing: AnotherT) => FormForType<AnotherT>,
  ) {
    this._fields.push({
      friendly,
      validators: [],
      key: nameOf(fs),
      fieldType: FieldType.FormProperty,
      formCreator,
    });
  }

  getFields(): Field[] {
    return this._fields;
  }
}

const applyModel = <ModelT>(
  t: makerOf<ModelT>,
  applyTo: FormAsModel<ModelT>,
  newModel: ModelT,
  fields: Field[],
) => {
  const cloneOfThing = cloneOf(t, newModel);

  Object.assign(applyTo, cloneOfThing);

  // do the forms
  const forms = fields.filter(f => f.fieldType == FieldType.Form);
  forms.forEach(form => {
    applyTo[form.key] = form.formCreator(cloneOfThing[form.key] || null);
  });

  // do the forms arrays
  const formArrays = fields.filter(f => f.fieldType == FieldType.FormArray);
  formArrays.forEach(formArray => {
    applyTo[formArray.key] = [];

    if (Array.isArray(cloneOfThing[formArray.key])) {
      cloneOfThing[formArray.key].forEach(d => {
        applyTo[formArray.key].push(formArray.formCreator(d));
      });
    }
  });

  const formProperties = fields.filter(
    f => f.fieldType == FieldType.FormProperty,
  );
  formProperties.forEach(formArray => {
    applyTo[formArray.key] = {};

    if (cloneOfThing[formArray.key] == null) return;

    for (const key in cloneOfThing[formArray.key]) {
      applyTo[formArray.key][key] = formArray.formCreator(
        cloneOfThing[formArray.key][key],
      );
    }
  });
};

export class FormAsModel<ModelT> extends Form {
  constructor(
    fields: Field[],
    private _t: makerOf<ModelT>,
    private _orig: ModelT,
  ) {
    super(undefined, fields);
  }

  applyModel(newModel: ModelT) {
    this.clearValidation();

    applyModel(this._t, this, newModel, this._fields);
  }

  // formArray fields could be weird in this if the models arew out of sync..
  // if you do ever call this yourself, make sure
  // that items haven't been moved around
  copyValidation(fasm: FormAsModel<ModelT>) {
    if (fasm == null) return;

    this.validationMessages = fasm.validationMessages;
    this._fields.forEach(
      f => (this.validation[f.key] = fasm.validation[f.key]),
    );

    const forms = this._fields.filter(f => f.fieldType == FieldType.Form);
    forms.forEach(f => {
      if (this[f.key] == null || fasm[f.key] == null) return;

      (this[f.key] as FormAsModel<any>).copyValidation(fasm[f.key]);
    });

    const formArrays = this._fields.filter(
      f => f.fieldType == FieldType.FormArray,
    );
    formArrays.forEach(f => {
      this[f.key].forEach((d, idx) => {
        if (fasm[f.key] == null || fasm[f.key][idx] == null) return;

        (d as FormAsModel<any>).copyValidation(fasm[f.key][idx]);
      });
    });

    const formProperties = this._fields.filter(
      f => f.fieldType == FieldType.FormProperty,
    );
    formProperties.forEach(f => {
      if (this[f.key] == null || fasm[f.key] == null) return;

      for (const key in this[f.key]) {
        if (fasm[f.key][key] == null) continue;

        (this[f.key][key] as FormAsModel<any>).copyValidation(fasm[f.key][key]);
      }
    });
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

    const formArrays = this._fields.filter(
      f => f.fieldType == FieldType.FormArray,
    );
    formArrays.forEach(f => {
      data[f.key] = [];

      this[f.key].forEach(d => {
        if (d == null) return;

        data[f.key].push((d as FormAsModel<any>).updatedModel());
      });
    });

    const formProperties = this._fields.filter(
      f => f.fieldType == FieldType.FormProperty,
    );
    formProperties.forEach(f => {
      data[f.key] = {};

      for (const key in this[f.key]) {
        if (this[f.key][key] == null) continue;

        data[f.key][key] = (this[f.key][key] as FormAsModel<
          any
        >).updatedModel();
      }
    });

    return data;
  }

  validate(settings?: any) {
    let shouldThrow = false;

    try {
      super.validate(settings);
    } catch (err) {
      shouldThrow = true;
    }

    const forms = this._fields.filter(f => f.fieldType == FieldType.Form);
    forms.forEach(f => {
      try {
        if (this[f.key] == null) return;

        this[f.key].validate(settings);
      } catch (err) {
        shouldThrow = true;
      }
    });

    const formArrays = this._fields.filter(
      f => f.fieldType == FieldType.FormArray,
    );
    formArrays.forEach(f => {
      this[f.key].forEach(d => {
        try {
          if (d == null) return;

          (d as FormAsModel<any>).validate(settings);
        } catch (err) {
          shouldThrow = true;
        }
      });
    });

    const formProperties = this._fields.filter(
      f => f.fieldType == FieldType.FormProperty,
    );
    formProperties.forEach(f => {
      for (const key in this[f.key]) {
        try {
          if (this[f.key][key] == null) continue;

          (this[f.key][key] as FormAsModel<any>).validate(settings);
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
}

export type FormForType<ModelT> = FormAsModel<ModelT> & ModelT;

export function formFor<ModelT>(
  t: makerOf<ModelT>,
  setup: (s: ModeledFormSetup<ModelT>) => void,
): (thing: ModelT) => FormForType<ModelT> {
  return (thing: ModelT) => {
    let oldForm = null;
    if (thing instanceof FormAsModel) {
      //throw new Error("Should not pass an instance of a form to a creator");

      // updated model, and also
      oldForm = thing;
      thing = thing.updatedModel();
    }

    const mfSetup = new ModeledFormSetup<ModelT>();
    setup(mfSetup);

    const fields = mfSetup.getFields();
    const fasm = new FormAsModel<ModelT>(fields, t, thing);

    applyModel(t, fasm, thing, fields);

    if (oldForm != null) fasm.copyValidation(oldForm);

    return fasm as FormForType<ModelT>;
  };
}

class TheValidationBuilder<T> implements ValidationBuilder<T> {
  validators: Validator[] = [];

  constructor(private value: any, private model: any, private settings: any, private fields: Field[]) {}

  use(...validators: Validator[]) {
    this.validators.push(...validators);
  }

  if(fs: (obj: T) => boolean, ...validators: Validator<T>[]) {
    if (fs(this.model)) this.use(...validators);
  }

  same(fs: (obj: T) => any, message?: string) {
    const key = nameOf(fs);
    this.use((input, model) => {
      if (input === model[key]) return null;
      if (message) return message;

      const f = this.fields.find(f => f.key == key);
      return `Must Match ${f == null ? key : f.friendly}`;
    });
  }

  matches(expr: RegExp, message: string) {
    this.use(input => expr.test(input) ? null : message);
  }

  validate() {
    for (let i = 0; i < this.validators.length; i++) {
      const message = this.validators[i].apply(null, [this.value, this.model, this.settings]);
      if (message != null) {
        return message;
      }
    }

    return null;
  }
}

import * as importedValidators from "./validators";
export const Validators = importedValidators;
