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
  addFilter,
  addImageSimilarityFilter,
  removeFilter,
  getCurrentFilters,
}) => {
  if (formatType !== 'ist-object') {
    return false;
  }

  const { basePath, limit: baseLimit } = params;
  let vals = basePath ? _.get(values, basePath) : values;

  if (!_.isArray(vals)) {
    vals = [vals];
  }

  const entryValues = [];

  for (let i = 0, len = baseLimit && vals.length >= baseLimit ? baseLimit : vals.length; i < len; i++) {
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

      let fieldValues = _.getPluck(val, path, null);
      let dHashValues = _.getPluck(val, dHashField, null);

      if (!_.isArray(fieldValues)) {
        fieldValues = [fieldValues];
      }

      if (!_.isArray(dHashValues)) {
        dHashValues = [dHashValues];
      }

      for (let i = 0, len = fieldLimit && fieldValues.length >= fieldLimit ? fieldLimit : fieldValues.length;  i < len; i++) {
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

  if (entryValues.length > 1 || entryValues.filter(v => !!v.dHashValue).length) {
    const currentFilters = getCurrentFilters();
 
    popover.setForm(entryValues, currentFilters, formValues => {
      for (let formValue of formValues) {
        let { path, value, dHashPath, dHashValue, distance, negate, checked } = formValue;
        if (checked) {
          if (dHashValue) {
            addImageSimilarityFilter({ path: dHashPath, value: dHashValue, distance })
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

 
/*










      const resultValues = _.getPluck(val, fieldPath);
      const dHashResultValues = _.getPluck(val, dHashFieldPath);

      console.log(resultValues, dHashResultValues);

      if (_.isArray(resultValues)) {
        const resultValuesLen = fieldLimit && resultValues.length >= fieldLimit ? fieldLimit : resultValues.length;

        for (let i = 0, len = resultValuesLen; i < len; i++) {
          let resultValue = resultValues[i];
          let dHashValue = dHashResultValues && dHashResultValues.length ? dHashResultValues[i] : null;

          entryValues.push({
            ...fieldEntry,
            negate: meta.negate,
            path: fullPath,
            value: resultValue,
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
          });
        }
      }
    }
  }

  if (entryValues.length > 1) {
    const currentFilters = getCurrentFilters();

    popover.setForm(entryValues, currentFilters, selectedEntryValues => {
      for (let selectedEntryValue of selectedEntryValues) {
        let { path, value, checked, negate } = selectedEntryValue;
        if (checked) {
          addFilter({ path, value, negate });
        } else {
          removeFilter({ path, value, negate });
        }
      }
    });
  } else if (entryValues.length === 1) {
    popover.hide();
    const { path, value, negate } = entryValues[0];
    addFilter({ path, value, negate });
  }
*/
