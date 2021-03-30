import { FilterMeta } from 'src/plugins/data/common';
import {
  DataPublicPluginStart,
  Filter,
  FilterManager,
  IndexPatternsContract,
} from '../../../src/plugins/data/public';
import { IndexPatternManagementSetup } from '../../../src/plugins/index_pattern_management/public';

interface filterManagerAddons {
  query: {
    filterManager: {
      register: any;
    };
  };
}

export interface StartPlugins {
  data: DataPublicPluginStart & filterManagerAddons;
}

export interface SetupPlugins {
  indexPatternManagement: IndexPatternManagementSetup;
}

export interface PluginSetup {}

export interface PluginStart {}

export interface CustomFilterManager extends FilterManager {
  register: (customFilter: any) => void;
  customFilters: any[];
}

export interface CustomFilterProps {
  filterManager: Partial<CustomFilterManager>;
  newFilters: Filter | Filter[];
  addFiltersCached: (filters: Filter | Filter[], pinFilterStatus?: boolean) => void;
  indexPatterns: IndexPatternsContract; 
}

export interface CustomFilterMeta extends FilterMeta {
  path: string;
  distance: string;
}

export interface EntryValues extends FilterMeta {
  path: string;
  distance: string;
}

export enum ObjectFieldType {
  IMAGE = 'image',
  LINK = 'link',
  TEXT = 'text',
}

export interface ObjectField {
  label?: string;
  path?: string;
  type: ObjectFieldType;
  filtered: boolean;
  dHashField?: string;
  filterField?: string;
  height?: number;
  width?: number;
  limit?: number;
}

export interface ObjectFieldParams {
  fieldType?: string;
  basePath?: string;
  limit?: number;
  similarityScript?: string;
  fields?: ObjectField[];
}

export { Filter };
