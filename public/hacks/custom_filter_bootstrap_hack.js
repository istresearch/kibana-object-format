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
    const formatType =
      fieldName && fieldFormatMap[fieldName] ? fieldFormatMap[fieldName].type.id : null;
    const params = fieldName && fieldFormatMap[fieldName] ? fieldFormatMap[fieldName]._params : {};
    const values = fieldName && matchPhrase[fieldName] ? matchPhrase[fieldName] : {};
    const meta = { negate: newFilter.meta.negate };
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
    const removeFunc = (filterName, entryValue, negate) => {
      const currentFilters = filterManager.getFilters();

      if (currentFilters.length > 0) {
        const filterIndex = currentFilters.findIndex(
          filter =>
            filter.meta.key === filterName &&
            filter.meta.params.query === entryValue &&
            filter.meta.key === negate
        );
        if (filterIndex >= 0) {
          filterManager.removeFilter(currentFilters[filterIndex]);
        }
      }
    };
    const getCurrentFilters = () =>
      filterManager.getFilters().map(filter => ({
        key: filter.meta.key,
        value: filter.meta.params.query,
        negate: filter.meta.negate,
        disable: filter.meta.disable,
      }));
    const filterParams = {
      fieldName,
      formatType,
      params,
      values,
      meta,
      addFunc,
      removeFunc,
      getCurrentFilters,
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
