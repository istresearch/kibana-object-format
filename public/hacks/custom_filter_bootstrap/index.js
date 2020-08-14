import _ from 'lodash';
import { uiModules } from 'ui/modules';
import { npStart } from 'ui/new_platform';
import '../../common/jquery-plugins/observer';
import FilterManagerHelper from './FilterManagerHelper';
import Popover from './Popover';

const app = uiModules.get('kibana');

const {
  query: { filterManager },
  indexPatterns,
} = npStart.plugins.data;

const popover = new Popover();

window.popover = popover;

filterManager.register = (customFilter) => {
  if (!filterManager.customFilters) {
    filterManager.customFilters = [];
  }

  filterManager.customFilters.push(customFilter);
};

app.run([
  '$rootScope',
  ($rootScope) => {
    $rootScope.$on('$routeChangeSuccess', (_$event, next) => {
      const {
        $$route: { originalPath },
      } = next;

      if (popover.isInit()) {
        popover.destroy();
      }

      popover.init();
    });
  },
]);

(async (indexPatterns, addFiltersCached) => {
  const indexPatternIDList = await indexPatterns.getFields(['id']);
  let indexPatternLookup = {};

  for (let pattern of indexPatternIDList) {
    let ip = await indexPatterns.get(pattern.id);
    indexPatternLookup[pattern.id] = ip.fieldFormatMap;
  }

  const filterManagerHelper = new FilterManagerHelper(addFiltersCached);

  filterManager.addFilters = (newFilters) => {
    if (_.isArray(newFilters) && newFilters.length !== 1) {
      addFiltersCached.apply(filterManager, newFilters);
    } else {
      const newFilter = newFilters[0];

      const selectedIndexPatternID = _.get(newFilter, 'meta.index', null);
      const fieldFormatMap = indexPatternLookup[selectedIndexPatternID];
      const matchPhrase = _.get(newFilter, 'query.match_phrase', {});
      const fieldNameKeys = Object.keys(matchPhrase);

      const fieldName = fieldNameKeys.length === 1 ? fieldNameKeys[0] : '';
      const formatType = _.get(fieldFormatMap, [fieldName, 'type', 'id'], null);
      const params = _.get(fieldFormatMap, [fieldName, '_params'], {});
      const values = _.get(matchPhrase, [fieldName], {});
      const meta = _.get(newFilter, 'meta', {});

      const {
        getCurrentFilters,
        addFilter,
        addImageSimilarityFilter,
        removeFilter,
      } = filterManagerHelper;
      filterManagerHelper.newFilter = newFilter;
      filterManagerHelper.similarityScript = _.get(params, 'similarityScript', '');

      const filterParams = {
        fieldName,
        formatType,
        params,
        values,
        meta,
        popover,
        addFilter: addFilter.bind(filterManagerHelper),
        addImageSimilarityFilter: addImageSimilarityFilter.bind(filterManagerHelper),
        removeFilter: removeFilter.bind(filterManagerHelper),
        getCurrentFilters: getCurrentFilters.bind(filterManagerHelper),
      };
      let customFilterFlag = false;

      for (let customFilter of filterManager.customFilters) {
        customFilterFlag = customFilter(filterParams);

        if (customFilterFlag) {
          break;
        }
      }

      if (!customFilterFlag) {
        addFiltersCached.apply(filterManager, newFilters);
      }
    }
  };
})(indexPatterns, filterManager.addFilters);
