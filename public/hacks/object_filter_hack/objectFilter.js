/* Placeholder for Filter Hack */
import _ from 'lodash';
import Popover from './Popover';
import './popover.less';

export const popover = new Popover();

export default ({
  fieldName,
  formatType,
  params,
  values,
  meta,
  addFunc,
  removeFunc,
  getCurrentFilters,
}) => {
  if (formatType !== 'ist-object') {
    return false;
  }

  const { basePath, limit } = params;
  let vals = basePath ? _.get(values, basePath) : values;

  if (!_.isArray(vals)) {
    vals = [vals];
  }

  const entryValues = [];

  for (let i = 0, len = limit || vals.length; i < len; i++) {
    let val = vals[i];

    for (let fieldEntry of params.fields) {
      let { path } = fieldEntry;
      let fullPath = basePath ? [fieldName, basePath, path].join('.') : [fieldName, path].join('.');

      if (fieldEntry.filterField) {
        fullPath = [fullPath, fieldEntry.filterField].join('.');
      }

      const plucked = _.getPluck(val, path);

      if (_.isArray(plucked)) {
        for (let i = 0, len = fieldEntry.limit || plucked.length; i < len; i++) {
          let v = plucked[i];
          entryValues.push({
            ...fieldEntry,
            negate: meta.negate,
            path: fullPath,
            value: v,
          });
        }
      } else {
        if (plucked) {
          entryValues.push({
            ...fieldEntry,
            negate: meta.negate,
            path: fullPath,
            value: plucked,
          });
        }
      }
    }
  }

  if (entryValues.length > 1) {
    const currentFilters = getCurrentFilters();

    popover.setForm(entryValues, currentFilters, selectedentryValues => {
      for (let sVal of selectedentryValues) {
        if (sVal.checked) {
          addFunc(sVal.path, sVal.value);
        } else {
          removeFunc(sVal.path, sVal.value, sVal.negate);
        }
      }
    });
  } else if (entryValues.length === 1) {
    popover.hide();
    const entryValue = entryValues[0];
    addFunc(entryValue.path, entryValue.value);
  }

  return true;
};
