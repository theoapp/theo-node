export const getTimestampFromISO8601 = string => {
  if (!string) {
    return 0;
  }
  let ret = 0;
  const type = typeof string;
  if (type === 'string') {
    const d = new Date(string);
    const ts = d.getTime();
    if (isNaN(ts)) {
      throw new Error('Invalid date string');
    }
    ret = ts;
  } else if (type === 'object') {
    const ts = string.getTime();
    if (isNaN(ts)) {
      throw new Error('Invalid date');
    }
    ret = ts;
  } else {
    ret = string;
  }
  return ret;
};
