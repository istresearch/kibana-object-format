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


    const getCurrentFilters = () =>
      filterManager.getFilters().map(filter => ({
        key: _.get(filter, 'query.bool.must.script.script.params.field', null) || _.get(filter, 'meta.key', null),
        value: _.get(filter, 'query.bool.must.script.script.params.dhash', null) || _.get(filter, 'meta.params.query', null),
        negate: _.get(filter, 'meta.negate', null),
        distance:  _.get(filter, 'query.bool.must.script.script.params.distance', null),
        disable: _.get(filter, 'meta.disable', null),
      }));

      const addFunc = (filterName, entryValue, alias = null) => // 1111  Add check to see if the filter already exists, if so ignore and don't change.
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

    const addImageSimilarityFunc = (field, dHash, distance = 8) => {
      removeFunc(field, dHash, newFilter.meta.negate);

      addFiltersOriginal.apply(filterManager, [
        {
          ...newFilter,
          meta: {
            alias: `Image Similarity: ${dHash} (${distance})`,
            negate: newFilter.meta.negate,
            index: newFilter.meta.index,
          },
          query: {
            bool: {
              must: {
                script: {
                  script: {
                    lang: 'painless',
                    params: {
                      dhash: dHash,
                      distance: parseInt(distance, 10),
                      field: field,
                    },
                    source:
                      'if(!doc.containsKey(params.field) || doc[params.field].empty) { return false; } else { return new BigInteger(params.dhash, 16).xor(new BigInteger(doc[params.field].value, 16)).bitCount() < params.distance; }',
                  },
                },
              },
            },
          },
        },
      ]);
    };

    const removeFunc = (filterName, entryValue, negate) => {
      const currentFilters = getCurrentFilters();
      const currentFilters2 = filterManager.getFilters();

      if (currentFilters.length > 0) {
        const filterIndex = currentFilters.findIndex(
          filter => filter.key === filterName && filter.value === entryValue && filter.negate === negate
        );

        console.log(filterIndex);

        if (filterIndex >= 0) {
          filterManager.removeFilter(currentFilters2[filterIndex]);
        }
      }
    };

    const filterParams = {
      fieldName,
      formatType,
      params,
      values,
      meta,
      addFunc,
      addImageSimilarityFunc,
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
