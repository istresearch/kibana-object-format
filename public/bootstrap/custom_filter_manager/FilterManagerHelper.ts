import { get } from 'lodash';
import { FilterMeta } from '../../../../../src/plugins/data/common';
import { Filter, FilterManager } from '../../../../../src/plugins/data/public';

class FilterManagerHelper {
  private addFiltersCache: (filters: Filter | Filter[], pinFilterStatus?: boolean) => void;
  private similarityScript: string = '';
  private newFilter: Partial<Filter> = {};
  private filterManager: FilterManager;

  constructor(addFiltersCache: any, filterManager: any) {
    this.addFiltersCache = addFiltersCache;
    this.similarityScript = '';
    this.filterManager = filterManager;
  }

  private getFilterIndex({ path, value, negate }: Partial<FilterMeta> & { path: string }) {
    const currentFilters = this.getCurrentFilters();

    return currentFilters.findIndex(
      (filter) => filter.path === path && filter.value === value && filter.negate === negate
    );
  }

  public getCurrentFilters() {
    return this.filterManager.getFilters().map((filter) => ({
      path:
        get(filter, 'query.bool.must.script.script.params.field', null) ||
        get(filter, 'meta.key', null),
      value:
        get(filter, 'query.bool.must.script.script.params.dhash', null) ||
        get(filter, 'meta.params.query', null),
      negate: get(filter, 'meta.negate', null),
      distance: get(filter, 'query.bool.must.script.script.params.distance', null),
    }));
  }

  public addFilter({ path, value, negate, alias = null }: Partial<FilterMeta> & { path: string }) {
    const filterIndex = this.getFilterIndex({ path, value, negate });

    if (filterIndex >= 0) {
      return;
    }

    this.addFiltersCache.apply(this.filterManager, [
      {
        ...this.newFilter,
        meta: {
          alias,
          negate: !!this.newFilter?.meta?.negate,
          index: this.newFilter?.meta?.index,
          disabled: false,
        },
        query: {
          match_phrase: {
            [path]: value,
          },
        },
      },
    ]);
  }

  public addImageSimilarityFilter({
    path,
    value,
    distance = '8',
  }: FilterMeta & { path: string; distance: string }) {
    this.removeFilter({ path, value, negate: true });
    this.removeFilter({ path, value, negate: false });

    this.addFiltersCache.apply(this.filterManager, [
      {
        ...this.newFilter,
        meta: {
          alias: `Image Similarity: ${value} (${distance})`,
          negate: !!this.newFilter?.meta?.negate,
          index: this.newFilter?.meta?.index,
          disabled: false,
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
                  source: this.similarityScript,
                },
              },
            },
          },
        },
      },
    ]);
  }

  public removeFilter({ path, value, negate }: Partial<FilterMeta> & { path: string }) {
    const currentFilters = this.filterManager.getFilters();
    const filterIndex = this.getFilterIndex({ path, value, negate });

    if (filterIndex >= 0) {
      this.filterManager.removeFilter(currentFilters[filterIndex]);
    }
  }
}

export default FilterManagerHelper;
