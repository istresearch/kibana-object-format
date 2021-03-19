import { isArray, has, slice, map, property, toPath, isObject } from 'lodash';

const toObject = (value: any) => {
  return isObject(value) ? value : Object(value);
};

const baseGetWithPluck = (object: any, path: any, pathKey: string) => {
  if (object == null) {
    return;
  }

  if (pathKey !== undefined && pathKey in toObject(object)) {
    path = [pathKey];
  }

  let index = 0;
  const length = path.length;

  while (object != null && index < length) {
    const key = path[index++];

    if (isArray(object) && !has(object, key)) {
      object = map(object, property(slice(path, index - 1)));
      index = length;
    } else {
      object = object[key];
    }
  }

  return index && index === length ? object : undefined;
};

export const getPluck = (object: any, path: any, defaultValue?: string) => {
  const result = object == null ? undefined : baseGetWithPluck(object, toPath(path), path + '');
  return result === undefined ? defaultValue : result;
};

export const getFullPath = ({
  basePath,
  field,
  path,
  filterField,
}: {
  field: { name: string };
  path: string;
  basePath?: string;
  filterField?: string;
}) => {
  const parts = [field.name];

  if (basePath) {
    parts.push(basePath);
  }


  parts.push(path);

  if (filterField) {
    parts.push(filterField);
  }

  return parts.join('.');
};

export const asPrettyString = (val: string): string => {
  if (val === null || val === undefined) return ' - ';
  switch (typeof val) {
    case 'string':
      return val;
    case 'object':
      return JSON.stringify(val, null, '  ');
    default:
      return '' + val;
  }
};
