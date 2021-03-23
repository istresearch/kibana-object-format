import { DataPublicPluginStart } from '../../../src/plugins/data/public';
import { IndexPatternManagementSetup } from '../../../src/plugins/index_pattern_management/public';

interface filterManagerAddons {
  query: {
    filterManager: {
      register: any
    }
  }
}

export interface StartPlugins {
  data: DataPublicPluginStart & filterManagerAddons;
}

export interface SetupPlugins {
  indexPatternManagement: IndexPatternManagementSetup;
}

export interface PluginSetup {}

export interface PluginStart {}