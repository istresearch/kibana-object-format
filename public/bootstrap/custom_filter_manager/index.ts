import { isArray, get } from 'lodash';
import Popover from './Popover';
import FilterManagerHelper from './FilterManagerHelper';
import { FilterManager } from '../../../../../src/plugins/data/public';

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

interface ICustomFilter {
  register: (customFilter: any) => void;
  customFilters: any[];
}

export const initFilterManager = (filterManager: FilterManager & Partial<ICustomFilter>) => {
  filterManager.register = (customFilter: any) => {
    if (!filterManager?.customFilters) {
      filterManager.customFilters = [];
    }

    filterManager.customFilters.push(customFilter);
  };
};

export const setupAddFilters = async ({ indexPatterns, addFiltersCached, filterManager }: any) => {
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
}: any) => {
  if (isArray(newFilters) && newFilters.length !== 1) {
    return;
  }

  const newFilter = newFilters[0];
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
