/* Placeholder for Filter Hack */
import _ from 'lodash';
import { uiModules } from 'ui/modules';
import Popover from './Popover';

const app = uiModules.get('kibana');
const popover = new Popover();

app.run([
  '$rootScope',
  $rootScope => {
    $rootScope.$on('$routeChangeSuccess', (_$event, next) => {
      const {
        $$route: { originalPath },
      } = next;

      if (popover.isInit()) {
        popover.destroy();
      }

      if (originalPath.indexOf('/discover/') !== -1) {
        popover.observe(
          'body',
          '.kbnDocTableRowFilterButton',
          '.kbnDocTableRowFilterButton.tippy-filter-button'
        );
        popover.observe('body', '.euiToolTipAnchor', '.euiToolTipAnchor.tippy-filter-button');
      }
    });
  },
]);

const objectFilter = ({ fieldName, formatType, params, values, addFunc, removeFunc, getCurrentFilters }) => {
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
        // Add Array thing
        for (let i = 0, len = fieldEntry.limit || plucked.length; i < len; i++) {
          let v = plucked[i];
          entryValues.push({
            ...fieldEntry,
            path: fullPath,
            value: v,
          });
        }
      } else {
        if (plucked) {
          entryValues.push({
            ...fieldEntry,
            path: fullPath,
            value: plucked,
          });
        }
      }
    }
  }

  if (entryValues.length > 1) {
    const currentFilters = getCurrentFilters();
    popover.setForm(entryValues, currentFilters, (selectedentryValues) => {
      for (let sVal of selectedentryValues) {
        if (sVal.checked) {
          addFunc(sVal.path, sVal.value);
        } else {
          removeFunc(sVal.path, sVal.value);
        }
      }
    });
  } else {

  } 

  return true;
};

export default objectFilter;
