import { NavigationPublicPluginStart } from '../../../src/plugins/navigation/public';
import { DataPublicPluginStart } from '../../../src/plugins/data/public';
import { IndexPatternManagementSetup } from '../../../src/plugins/index_pattern_management/public';

export interface StartPlugins {
  navigation: NavigationPublicPluginStart;
  data: DataPublicPluginStart;
}

export interface SetupPlugins {
  indexPatternManagement: IndexPatternManagementSetup;
}

export interface PluginSetup {}

export interface PluginStart {}
