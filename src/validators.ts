export type Validator = (input: any, model?: any, settings?: any) => string;

const trimInput = input => {
  if (input != null && input.trim && typeof input.trim == "function")
    return input.trim();

  return input;
};

export const required = (input: string) => {
  if (input == null || input.length == 0) return "Required";
  const hasValue =
    input
      .toString()
      .replace(/^\s+/, "")
      .replace(/\s+$/, "").length > 0;
  return hasValue ? null : "Required";
};

const emailRegEx = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@((?=[a-z0-9-]{1,63}\.)(xn--)?[a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,63}$/i;
export const isEmail = (input: string) => {
  if (input == null || input.length == 0) return null;
  input = trimInput(input);
  return emailRegEx.test(input) ? null : "Not a valid Email Address";
};

export const isNumber = (input: string) => {
  if (input == null || input.length == 0) return null;
  input = trimInput(input);
  const isNumeric = !isNaN(<any>input - parseFloat(input));
  return isNumeric ? null : "Not a valid number";
};

export const isInteger = (input: string) => {
  if (input == null || input.length == 0) return null;
  input = trimInput(input);
  const isInt = parseFloat(input) - parseInt(input) === 0;
  return isInt ? null : "Not a valid integer";
};

export const inRange = (min: number, max: number) => {
  return (input: string) => {
    if (input == null || input.length == 0) return null;
    input = trimInput(input);

    const num = parseFloat(input);
    if (isNumber(input) != null) return null;

    if (min != null && max != null) {
      return num >= min && num <= max
        ? null
        : `Must be between ${min} and ${max}`;
    } else if (min != null) {
      return num >= min ? null : `Must be at least ${min}`;
    } else if (max != null) {
      return num <= max ? null : `Must be at most ${max}`;
    } else {
      return null;
    }
  };
};

export interface UrlOptions {
  allowedProtocols?: string[];
  requireProtocol?: boolean;
  allowPath?: boolean;
  allowPort?: boolean;
}

// this setup acts like a hostname validation
const defaultUrlOptions: UrlOptions = {
  allowedProtocols: [],
  requireProtocol: false,
  allowPath: false,
  allowPort: false,
};

export const isUrl = (options: UrlOptions = defaultUrlOptions) => {
  const opts = Object.assign({} as UrlOptions, defaultUrlOptions, options);

  // hostname regex
  let regExStr = "(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\\-]*[a-zA-Z0-9])\\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\\-]*[A-Za-z0-9])";

  let protocolRegex = "";

  if (opts.allowedProtocols != null && opts.allowedProtocols.length > 0) {
    const withSlashes = opts.allowedProtocols.map(p => {
      if (p.endsWith("://")) return p;
      return p + "://";
    });

    protocolRegex = `(${withSlashes.join("|")})`;
  }

  if (!opts.requireProtocol && protocolRegex.length > 0) {
    protocolRegex += "?";
  }

  let pathRegex = "";
  if (opts.allowPath) {
    pathRegex = "(/.*)?";
  }

  let portRegex = "";
  if (opts.allowPort) {
    portRegex = "(:\\d+)?";
  }

  const s = "^" + protocolRegex + regExStr + portRegex + pathRegex + "$";
  const regEx = new RegExp(s);

  return (input: string) => {
    if (input == null || input.length == 0) return null;
    input = trimInput(input);
    return regEx.test(input) ? null : "Not Valid";
  };
};

export const isMinLength = (num: number) => {
  return (input: string) => {
    if (input == null || input.length == 0) return null;
    input = trimInput(input);
    return input.length >= num
      ? null
      : "Must be at least " + num + " characters";
  };
};

export const isChecked = (input: any) => {
  if (input == null) return null;
  return input === true ? null : "Required";
};

export const isLength = (num: number) => {
  return (input: string): string => {
    input = trimInput(input);
    if (input.length < num) {
      return "Must be at least ${num} characters";
    }
    return null;
  };
};
