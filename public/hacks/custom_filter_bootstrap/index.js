import _ from 'lodash';
import { uiModules } from 'ui/modules';
import { npStart } from 'ui/new_platform';
import '../../common/jquery-plugins/observer';
import FilterManagerHelper from './FilterManagerHelper'
import Popover from './Popover';

const app = uiModules.get('kibana');

const {
  query: { filterManager },
  indexPatterns,
} = npStart.plugins.data;

const popover = new Popover();

window.popover = popover;

filterManager.register = customFilter => {
  if (!filterManager.customFilters) {
    filterManager.customFilters = [];
  }

  filterManager.customFilters.push(customFilter);
};

app.run(['$rootScope', ($rootScope) => {
  $rootScope.$on('$routeChangeSuccess', (_$event, next) => {
    const {
      $$route: { originalPath },
    } = next;
 
    if (popover.isInit()) {
      popover.destroy();
    }

    if (originalPath.indexOf('/discover/') !== -1) {
      popover.init();
    }
  });
}]);

(async (indexPatterns, addFiltersCached) => {
  const indexPatternList = await indexPatterns.getFields(['id', 'title']);
  let selectedIndexPattern = null;

  const filterManagerHelper = new FilterManagerHelper(addFiltersCached);

  await $('body').observe('.indexPattern__triggerButton', async () => {
    const ipTitle = $('.indexPattern__triggerButton > span > span').text();
    const ip = indexPatternList.filter(ipItem => ipItem.title === ipTitle);
    if (ip.length === 1) {
      selectedIndexPattern = await indexPatterns.get(ip[0].id);
    }
  });

  filterManager.addFilters = newFilters => {
    if (_.isArray(newFilters) && newFilters.length !== 1) {
      return;
    }

    const { fieldFormatMap } = selectedIndexPattern;

    const newFilter = newFilters[0];
    const matchPhrase =  _.get(newFilter, 'query.match_phrase', {});
    const fieldNameKeys = Object.keys(matchPhrase);
    
    const fieldName = fieldNameKeys.length === 1 ? fieldNameKeys[0] : '';
    const formatType = _.get(fieldFormatMap, [fieldName, 'type', 'id'], null); 
    const params = _.get(fieldFormatMap, [fieldName, '_params'], {});   
    const values = _.get(matchPhrase,[fieldName], {});   
    const meta = _.get(newFilter, 'meta', {});  

    const { getCurrentFilters, addFilter, addImageSimilarityFilter, removeFilter } = filterManagerHelper;
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
  };
})(indexPatterns, filterManager.addFilters);
