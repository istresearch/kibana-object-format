import { CoreSetup, CoreStart, Plugin } from 'kibana/public';
import { StartPlugins, PluginStart, SetupPlugins, PluginSetup } from './types';
import { ObjectFieldFormat } from './field_formatters/ObjectFieldFormat';
import { ObjectFieldFormatEditor } from './field_formatters/ObjectFieldFormatEditor';
import { fieldMapper } from './field_mapper';
import { Filter, GetFieldsOptions } from 'src/plugins/data/common';
import { addFilters, initFilterManager, initPopover, setupAddFilters } from './field_filters_bootstrap';
import { objectFilter } from './field_filters/objectFilter';
import updateFieldFormatTemplate from './field_formatters/updateFieldFormatTemplate';
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
        data.query.filterManager.register(objectFilter);
      }
      initPopover();
      updateFieldFormatTemplate(true);
      init = true;
    });

    return {};
  }

  public stop() {}
}
