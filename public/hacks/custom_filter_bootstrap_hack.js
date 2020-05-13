import _ from 'lodash';
import { npStart } from 'ui/new_platform';
import '../common/jquery-plugins/observer';
import FilterManagerHelper from './FilterManagerHelper'

const {
  query: { filterManager },
  indexPatterns,
} = npStart.plugins.data;

filterManager.register = customFilter => {
  if (!filterManager.customFilters) {
    filterManager.customFilters = [];
  }

  filterManager.customFilters.push(customFilter);
};


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
      addFiltersOriginal.apply(filterManager, newFilters);
    }
  };
})(indexPatterns, filterManager.addFilters);
