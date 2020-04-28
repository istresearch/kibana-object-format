import _ from 'lodash';
import { npStart } from 'ui/new_platform';
import '../common/jquery-plugins/observer';

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

(async (indexPatterns, addFiltersOriginal) => {
  const indexPatternList = await indexPatterns.getFields(['id', 'title']);
  let selectedIndexPattern = null;

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
    const matchPhrase = _.get(newFilter, 'query.match_phrase', {});
    const newFilterKeys = Object.keys(matchPhrase);
    const fieldName = newFilterKeys.length === 1 ? newFilterKeys[0] : null;
    const formatType = fieldName && fieldFormatMap[fieldName] ? fieldFormatMap[fieldName].type.id : null;
    const params = fieldName && fieldFormatMap[fieldName] ? fieldFormatMap[fieldName]._params : {};
    const values = fieldName && matchPhrase[fieldName] ? matchPhrase[fieldName] : {};
    const addFunc = (filterName, entryValue, alias = null) =>
      addFiltersOriginal.apply(filterManager, [
        {
          ...newFilter,
          meta: {
            alias,
            negate: newFilter.meta.negate,
            index: newFilter.meta.index,
          },
          query: {
            match_phrase: {
              [filterName]: entryValue,
            },
          },
        },
      ]);

    const filterParams = {
      fieldName,
      formatType,
      params,
      values,
      addFunc,
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
