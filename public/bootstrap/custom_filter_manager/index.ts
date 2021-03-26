import { isArray, get } from 'lodash';
import Popover from './Popover';
import FilterManagerHelper from './FilterManagerHelper';
import { CustomFilterProps, CustomFilterManager } from '../../types';

let popover: Popover | undefined;
let filterManagerHelper: any;
let indexPatternLookup: any = {};

if (!popover) {
  popover = new Popover();
  (window as any).popover = popover;
}

export const initPopover = () => {
  if (popover?.isInitialized()) {
    popover.destroy();
  }

  popover?.initialize();
};

export const initFilterManager = (filterManager: Partial<CustomFilterManager>) => {
  filterManager.register = (customFilter: any) => {
    if (!filterManager?.customFilters) {
      filterManager.customFilters = [];
    }

    filterManager.customFilters.push(customFilter);
  };
};

export const setupAddFilters = async ({
  indexPatterns,
  addFiltersCached,
  filterManager,
}: Pick<CustomFilterProps, 'indexPatterns' | 'addFiltersCached' | 'filterManager'>) => {
  const indexPatternIDList = await indexPatterns.getIds();

  for (let id of indexPatternIDList) {
    let ip = await indexPatterns.get(id);
    indexPatternLookup[id] = ip.fieldFormatMap;
  }

  filterManagerHelper = new FilterManagerHelper(addFiltersCached, filterManager);
};

export const addFilters = async ({
  filterManager,
  newFilters,
  addFiltersCached,
  indexPatterns,
}: CustomFilterProps) => {
  if (isArray(newFilters) && newFilters.length !== 1) {
    return;
  }

  const newFilter = Array.isArray(newFilters) ? newFilters[0] : newFilters;
  const selectedIndexPatternID = get(newFilter, 'meta.index', null);
  const selectedIndexPattern = await indexPatterns.get(selectedIndexPatternID);
  const fieldFormatMap = selectedIndexPattern.fieldFormatMap;
  const matchPhrase = get(newFilter, 'query.match_phrase', {});
  const fieldNameKeys = Object.keys(matchPhrase);
  const fieldName = fieldNameKeys.length === 1 ? fieldNameKeys[0] : '';
  const formatType = get(fieldFormatMap, [fieldName, 'id'], null);
  const params = get(fieldFormatMap, [fieldName, 'params'], {});
  const values = get(matchPhrase, [fieldName], {});
  const meta = get(newFilter, 'meta', {});

  const {
    getCurrentFilters,
    addFilter,
    addImageSimilarityFilter,
    removeFilter,
  } = filterManagerHelper;
  filterManagerHelper.newFilter = newFilter;
  filterManagerHelper.similarityScript = get(params, 'similarityScript', '');

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

  if (filterManager.customFilters) {
    for (let customFilter of filterManager.customFilters) {
      customFilterFlag = customFilter(filterParams);

      if (customFilterFlag) {
        break;
      }
    }
  }

  if (!customFilterFlag) {
    addFiltersCached.apply(filterManager, [newFilters]);
  }
};
