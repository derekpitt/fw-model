export type Validator = (input: any, model?: any, settings?: any) => string;

export function required(input: string) {
  if (input == null || input.length == 0) return "Required";
  const hasValue = input.toString().replace(/^\s+/, "").replace(/\s+$/, "").length > 0;
  return hasValue ? null : "Required";
}

const emailRegEx = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@((?=[a-z0-9-]{1,63}\.)(xn--)?[a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,63}$/i;
export function isEmail(input: string) {
  if (input == null || input.length == 0) return null;
  return emailRegEx.test(input) ? null : "Not a valid Email Address";
}

export function isNumber(input: string) {
  if (input == null || input.length == 0) return null;
  const isNumeric = !isNaN(<any>input - parseFloat(input));
  return isNumeric ? null : "Not a valid number";
}

export function isInteger(input: string) {
  if (input == null || input.length == 0) return null;
  const isInt = parseFloat(input) - parseInt(input) === 0;
  return isInt ? null : "Not a valid integer";
}

export function inRange(min: number, max: number) {
  return function(input: string) {
    if (input == null || input.length == 0) return null;

    const num = parseFloat(input);
    if (isNumber(input) != null) return null;
    
    if (min != null && max != null) {
      return (num >= min && num <= max) ? null : `Must be between ${min} and ${max}`;
    } else if (min != null) {
      return num >= min ? null : `Must be at least ${min}`
    } else if (max != null) {
      return num <= max ? null : `Must be at most ${max}`
    } else {
      return null;
    }
  }
}

export function isUrl(enforceSSL: boolean = false) {
  return function(input: string) {
    if (input == null || input.length == 0) return null;
    let urlRegEx = new RegExp(String.raw`^((https${enforceSSL ? '' : '?'}):\/\/)${enforceSSL ? '' : '?'}(www.)?[a-z0-9]+(\.[a-z]+)+(\/?[-a-zA-Z0-9@:%_\+.~#?&\/\/=]+\/?)*$`);
    return urlRegEx.test(input) ? null : `Not a valid ${enforceSSL ? 'SSL ' : ''}URL`;
  }
}

export function isMinLength(num: number) {
  return function(input: string) {
    if (input == null || input.length == 0) return null;
    return input.length >= num ? null : "Must be at least " + num + " characters";
  }
}

export function isChecked(input: any) {
  if (input == null) return null;
  return input === true ? null : "Required";
}

export function isLength(num: number) {
  return function(input: string): string {
    if (input.length < num) {
      return "Must be at least ${num} characters";
    }
    return null;
  }
}
