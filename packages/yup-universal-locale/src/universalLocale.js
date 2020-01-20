import { mixed } from 'yup';
import globalLocale from 'yup/lib/locale';

const wrappedTest = mixed.prototype.test;

mixed.prototype.test = function(...args) {
  let opts;

  if (args.length === 1) {
    if (typeof args[0] === 'function') {
      opts = { test: args[0] };
    } else {
      opts = args[0];
    }
  } else if (args.length === 2) {
    opts = { name: args[0], test: args[1] };
  } else {
    opts = { name: args[0], message: args[1], test: args[2] };
  }

  if (opts.message === undefined) {
    if (globalLocale[this._type] && globalLocale[this._type][opts.name]) {
      opts.message = globalLocale[this._type][opts.name];
    } else if (globalLocale.mixed[opts.name]) {
      opts.message = globalLocale.mixed[opts.name];
    } else {
      opts.message = globalLocale.mixed.default;
    }
  }
  return wrappedTest.apply(this, [opts]);
}