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
  addImageSimilarityFunc,
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
  const valLen = limit && vals.length >= limit ? limit : vals.length;
  let hasdHashPath = false;

  for (let i = 0; i < valLen; i++) {
    let val = vals[i];

    for (let fieldEntry of params.fields) {
      let { path, dHashPath, limit: fieldLimit, filterField } = fieldEntry;

      let fullPath = basePath ? `${fieldName}.${basePath}.${path}` : `${fieldName}.${path}`;
      let fullDHashPath = null;

      if (filterField) {
        fullPath = `${fullPath}.${filterField}`;
      }

      if (dHashPath) {
        fullDHashPath = basePath ? `${fieldName}.${basePath}.${dHashPath}` : `${fieldName}.${dHashPath}`;

        if (filterField) {
          fullDHashPath = `${fullDHashPath}.${filterField}`;
        }
      }

      const plucked = _.getPluck(val, path);
      const pluckedDHash = _.getPluck(val, dHashPath);
      hasdHashPath = !!pluckedDHash;

      if (_.isArray(plucked)) {
        const pluckedLen = fieldLimit && plucked.length >= fieldLimit ? fieldLimit : plucked.length;
        for (let i = 0; i < pluckedLen; i++) {
          let v = plucked[i];
          let dHashValue = pluckedDHash && pluckedDHash.length ? pluckedDHash[i] : null;
          entryValues.push({
            ...fieldEntry,
            negate: meta.negate,
            path: fullPath,
            value: v,
            dHashPath: fullDHashPath,
            dHashValue,
          });
        }
      } else {
        if (plucked) {
          entryValues.push({
            ...fieldEntry,
            negate: meta.negate,
            path: fullPath,
            value: plucked,
            dHashPath: fullDHashPath,
            dHashValue: pluckedDHash,
          });
        }
      }
    }
  }

  if (entryValues.length > 1 || hasdHashPath) {
    const currentFilters = getCurrentFilters();
 
    popover.setForm(entryValues, currentFilters, selectedentryValues => {
      for (let sVal of selectedentryValues) {
        if (sVal.checked) {
          if (sVal.dHashValue) {
            addImageSimilarityFunc(sVal.dHashPath, sVal.dHashValue);
          } else {
            addFunc(sVal.path, sVal.value);
          }
        } else {
          removeFunc(sVal.path, sVal.value, sVal.negate);
        }
      }  
    });
  } else if (entryValues.length === 1) {
    popover.hide();
    const entryValue = entryValues[0];
    //addFunc(entryValue.path, entryValue.value);
  }

  return true;
};
