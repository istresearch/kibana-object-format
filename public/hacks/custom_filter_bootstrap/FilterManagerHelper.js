import _ from 'lodash';
import { npStart } from 'ui/new_platform';

const {
  query: { filterManager },
} = npStart.plugins.data;

class FilterManagerHelper {
  constructor(addFiltersCache) {
    this._addFiltersCache = addFiltersCache;
    this._newFilter = {};
    this._similarityScript = '';
  }

  set newFilter(newFilter) {
    this._newFilter = newFilter;
  }

  set similarityScript(similarityScript) {
    this._similarityScript = similarityScript;
  }

  getCurrentFilters() {
    return filterManager.getFilters().map(filter => ({
      path: _.get(filter, 'query.bool.must.script.script.params.field', null) || _.get(filter, 'meta.key', null),
      value: _.get(filter, 'query.bool.must.script.script.params.dhash', null) || _.get(filter, 'meta.params.query', null),
      negate: _.get(filter, 'meta.negate', null),
      distance: _.get(filter, 'query.bool.must.script.script.params.distance', null),
    }));
  }

  getFilterIndex({ path, value, negate }) {
    const currentFilters = this.getCurrentFilters();

    return currentFilters.findIndex(
      filter => filter.path === path && filter.value === value && filter.negate === negate
    );
  }

  addFilter({ path, value, negate, alias = null }) {
    const filterIndex = this.getFilterIndex({ path, value, negate });

    if (filterIndex >= 0) {
        return;
    }

    this._addFiltersCache.apply(filterManager, [
      {
        ...this._newFilter,
        meta: {
          alias,
          negate: this._newFilter.meta.negate,
          index: this._newFilter.meta.index,
        },
        query: {
          match_phrase: {
            [path]: value,
          },
        },
      },
    ]);
  }

  addImageSimilarityFilter({ path, value, distance = 8 }) {
    this.removeFilter({ path, value, negate: true });
    this.removeFilter({ path, value, negate: false });

    this._addFiltersCache.apply(filterManager, [
      {
        ...this._newFilter,
        meta: {
          alias: `Image Similarity: ${value} (${distance})`,
          negate: this._newFilter.meta.negate,
          index: this._newFilter.meta.index,
        },
        query: {
          bool: {
            must: {
              script: {
                script: {
                  lang: 'painless',
                  params: {
                    dhash: value,
                    distance: parseInt(distance, 10),
                    field: path,
                  },
                  source: this._similarityScript,
                },
              },
            },
          },
        },
      },
    ]);
  }

  removeFilter({ path, value, negate }) {
    const currentFilters = filterManager.getFilters();
    const filterIndex = this.getFilterIndex({ path, value, negate });

    if (filterIndex >= 0) {
      filterManager.removeFilter(currentFilters[filterIndex]);
    }
  }
}

export default FilterManagerHelper;
