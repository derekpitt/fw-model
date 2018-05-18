declare module 'fw-model/validators' {
	export type Validator<T = any> = (input: any, model?: T, settings?: any) => string;
	export interface ValidationBuilder<T> {
	    use(...validators: Validator<T>[]): any;
	    if(fs: (obj: T) => boolean, ...validators: Validator<T>[]): any;
	    same(fs: (obj: T) => any, message?: string): any;
	    matches(expr: RegExp, message: string): any;
	}
	export const required: (input: string) => string;
	export const isEmail: (input: string) => string;
	export const isNumber: (input: string) => string;
	export const isInteger: (input: string) => string;
	export const inRange: (min: number, max: number) => (input: string) => string;
	export interface UrlOptions {
	    allowedProtocols?: string[];
	    requireProtocol?: boolean;
	    allowPath?: boolean;
	    allowPort?: boolean;
	    requireTld?: boolean;
	}
	export const isUrl: (options?: UrlOptions) => (input: string) => string;
	export const isMinLength: (num: number) => (input: string) => string;
	export const isChecked: (input: any) => string;
	export const wrap: (...validators: Validator<any>[]) => (ValidationBuilder: any) => void;

}
declare module 'fw-model' {
	import { Validator, ValidationBuilder } from 'fw-model/validators';
	export interface makerOf<T> {
	    new (...args: any[]): T;
	}
	export function fromClass(target: any, key: any, descriptor?: any): void;
	export function fromClassArray(arrayType: any): (target: any, key: any, descriptor?: any) => void;
	export function fromPropertyClass(propertyClass: any): (target: any, key: any, descriptor?: any) => void;
	export function fromCustom(customFunction: (data, parent) => any): (target: any, key: any, descriptor?: any) => void;
	export function createFromProperties<T>(cl: makerOf<T>, data: any): {
	    [key: string]: T;
	};
	export function createFromArray<T>(cl: makerOf<T>, data: any[]): T[];
	export function createFrom<T>(cl: makerOf<T>, data: any, parent?: any): T;
	export type Validator = (input: any, model?: any, settings?: any) => string;
	export enum FieldType {
	    Field = 0,
	    Form = 1,
	    FormArray = 2,
	    FormProperty = 3,
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
	export function field(friendly: string, ...validators: Validator[]): (target: any, key: any) => void;
	export function getFields(target: any): Field[];
	export interface ValidationResult {
	    field: string;
	    message: string;
	}
	export function validateModel(model: any, fields: Field[], settings?: any): ValidationResult[];
	export class Form {
	    validationMessages: string[];
	    validation: {
	        [key: string]: string;
	    };
	    isInvalid: boolean;
	    protected _fields: Field[];
	    constructor(data?: any, fields?: Field[]);
	    getFieldName(field: string): string;
	    validate(settings?: any): void;
	    clearValidation(): void;
	    protected copyFields(src: any): void;
	}
	export function cloneOf<T>(modelType: makerOf<T>, instance: T): T;
	export function nameOf<T>(expr: (T) => any): string;
	export class ModeledFormSetup<T> {
	    private _fields;
	    requiredField(fs: (obj: T) => any, friendly: string, ...builders: ValidationBuilderArg<T>[]): void;
	    field(fs: (obj: T) => any, friendly: string, ...builders: ValidationBuilderArg<T>[]): void;
	    form<AnotherT>(fs: (obj: T) => any, friendly: string, formCreator: (thing: AnotherT) => FormForType<AnotherT>): void;
	    formArray<AnotherT>(fs: (obj: T) => any, friendly: string, formCreator: (thing: AnotherT) => FormForType<AnotherT>): void;
	    formProperty<AnotherT>(fs: (obj: T) => any, friendly: string, formCreator: (thing: AnotherT) => FormForType<AnotherT>): void;
	    getFields(): Field[];
	}
	export class FormAsModel<ModelT> extends Form {
	    private _t;
	    private _orig;
	    constructor(fields: Field[], _t: makerOf<ModelT>, _orig: ModelT);
	    applyModel(newModel: ModelT): void;
	    copyValidation(fasm: FormAsModel<ModelT>): void;
	    updatedModel(): ModelT;
	    validate(settings?: any): void;
	}
	export type FormForType<ModelT> = FormAsModel<ModelT> & ModelT;
	export function formFor<ModelT>(t: makerOf<ModelT>, setup: (s: ModeledFormSetup<ModelT>) => void): (thing: ModelT) => FormForType<ModelT>;
	import * as importedValidators from 'fw-model/validators';
	export const Validators: typeof importedValidators;

}
