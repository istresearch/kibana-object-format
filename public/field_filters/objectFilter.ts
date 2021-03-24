import { isArray, get } from 'lodash';
import { getPluck } from '../utils';

export const objectFilter = ({
  fieldName,
  formatType,
  params,
  values,
  meta,
  addFilter,
  addImageSimilarityFilter,
  removeFilter,
  getCurrentFilters,
  popover,
}: any) => {
  if (formatType !== 'ist-object') {
    return false;
  }

  const { basePath, limit: baseLimit } = params;
  let vals = basePath ? get(values, basePath) : values;

  if (!isArray(vals)) {
    vals = [vals];
  }

  const entryValues = [];

  for (
    let i = 0, len = baseLimit && vals.length >= baseLimit ? baseLimit : vals.length;
    i < len;
    i++
  ) {
    let val = vals[i];

    for (let fieldEntry of params.fields) {
      let { path, limit: fieldLimit, dHashField, filterField } = fieldEntry;

      let fullFieldPath = basePath ? `${fieldName}.${basePath}.${path}` : `${fieldName}.${path}`;
      let fullDHashFieldPath = basePath
        ? `${fieldName}.${basePath}.${dHashField}`
        : `${fieldName}.${dHashField}`;

      if (filterField) {
        fullFieldPath = `${fullFieldPath}.${filterField}`;
        fullDHashFieldPath = `${fullDHashFieldPath}.${filterField}`;
      }

      let fieldValues = getPluck(val, path);
      let dHashValues = getPluck(val, dHashField);

      if (!isArray(fieldValues)) {
        fieldValues = [fieldValues];
      }

      if (!isArray(dHashValues)) {
        dHashValues = [dHashValues];
      }

      for (
        let i = 0,
          len = fieldLimit && fieldValues.length >= fieldLimit ? fieldLimit : fieldValues.length;
        i < len;
        i++
      ) {
        let fieldValue = fieldValues.length > i ? fieldValues[i] : null;
        let dHashValue = dHashValues.length > i ? dHashValues[i] : null;

        entryValues.push({
          ...fieldEntry,
          negate: meta.negate,
          path: fullFieldPath,
          value: fieldValue,
          dHashPath: dHashValue && fullDHashFieldPath,
          dHashValue,
        });
      }
    }
  }

  if (entryValues.length > 1 || entryValues.filter((v) => !!v.dHashValue).length) {
    const currentFilters = getCurrentFilters();
    // @ts-ignore
    popover.setForm(entryValues, currentFilters, (formValues) => {
      for (let formValue of formValues) {
        let { path, value, dHashPath, dHashValue, distance, negate, checked } = formValue;
        if (checked) {
          if (dHashValue) {
            addImageSimilarityFilter({ path: dHashPath, value: dHashValue, distance });
          } else {
            addFilter({ path, value, negate });
          }
        } else {
          removeFilter({ path: dHashPath || path, value: dHashValue || value, negate });
        }
      }
    });
  } else if (entryValues.length === 1) {
    popover.hide();
    const { path, value, negate } = entryValues[0];
    addFilter({ path, value, negate });
  }

  return true;
};
