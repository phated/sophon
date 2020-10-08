export function toBoolean(val) {
  if (typeof val === 'string') {
    return val.toLowerCase() === 'true';
  }
}

export function toNumber(val) {
  if (typeof val === 'string') {
    return parseInt(val, 10);
  }

  if (typeof val === 'number') {
    return val;
  }
}

export function toObject(val) {
  if (typeof val === 'string') {
    return JSON.parse(val);
  }
}
