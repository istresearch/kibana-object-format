/* Placeholder for Filter Hack */
import _ from 'lodash';
import { uiModules } from 'ui/modules';
import { npStart } from 'ui/new_platform';
const app = uiModules.get('kibana');
const { filterManager } = npStart.plugins.data.query;

const objectFilter = paramsFilter => {
    const { fieldName, formatType, params, values, addFunc } = paramsFilter;
  
    if (formatType !== 'ist-object') {
      return false;
    }
  
    const { basePath } = params;
    let vals = { ...values };
  
    if (basePath) {
      vals = _.get(vals, basePath);
    }
  
    if (!_.isArray(values)) {
      vals = [vals];
    }
  
    for (let fieldEntry of params.fields) {
      if (fieldEntry.filtered) {
        let path = fieldEntry.path;
        const entryValues = [];
  
        for (let value of vals) {
          const plucked = _.getPluck(value, path);
  
          if (_.isArray(plucked)) {
            for (let v of plucked) {
              if (v) {
                entryValues.push(v);
              }
            }
          } else {
            if (plucked) {
              entryValues.push(plucked);
            }
          }
        }
  
        let fullPath = basePath ? [fieldName, basePath, path].join('.') : [fieldName, path].join('.');
  
        if (fieldEntry.filterField) {
          fullPath = [fullPath, fieldEntry.filterField].join('.');
        }
  
        for (let entryValue of entryValues) {
          addFunc(fullPath, entryValue);
        }
      }
    }
  
    return true;
  };

app.run(['config', function(_config) {
  filterManager.register(objectFilter);
}]);