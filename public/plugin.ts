import { CoreSetup, CoreStart, Plugin } from 'kibana/public';
import { StartPlugins, PluginStart, SetupPlugins, PluginSetup } from './types';
import {
  fieldMapper,
  addFilters,
  initFilterManager,
  initPopover,
  setupAddFilters,
  updateFieldTemplate,
} from './bootstrap';
import { ObjectFieldFormat, ObjectFieldFormatEditor, objectFieldFilter } from './object_field';
import { Filter, GetFieldsOptions } from '../../../src/plugins/data/common';
import './utils/jqueryObserver';

export class KibanaObjectFormatPlugin
  implements Plugin<PluginSetup, PluginStart, SetupPlugins, StartPlugins> {
  public setup(core: CoreSetup<StartPlugins, PluginStart>, pluginSetup: SetupPlugins): PluginSetup {
    pluginSetup.indexPatternManagement.fieldFormatEditors.register(ObjectFieldFormatEditor);

    core.getStartServices().then(([{ uiSettings }, { data }]) => {
      data.fieldFormats.register([ObjectFieldFormat]);
      const indexPatterns = data?.indexPatterns;

      ((getFieldsForWildcardCached) => {
        indexPatterns.getFieldsForWildcard = async (options: GetFieldsOptions) => {
          const fields = await getFieldsForWildcardCached(options);
          const { pattern } = options;

          return fieldMapper({ uiSettings, fields, pattern });
        };
      })(indexPatterns.getFieldsForWildcard);

      const filterManager = data?.query?.filterManager;
      initFilterManager(filterManager);

      (async (addFiltersCached) => {
        await setupAddFilters({
          indexPatterns,
          addFiltersCached,
          filterManager,
        });

        filterManager.addFilters = async (filters: Filter | Filter[]) => {
          await addFilters({ newFilters: filters, addFiltersCached, filterManager, indexPatterns });
        };
      })(filterManager?.addFilters);
    });

    return {};
  }

  public start(core: CoreStart, { data }: StartPlugins) {
    let init = false;

    core.application.currentAppId$.subscribe(() => {
      if (!init) {
        data.query.filterManager.register(objectFieldFilter);
      }
      initPopover();
      updateFieldTemplate(true);
      init = true;
    });

    return {};
  }

  public stop() {}
}
