import { AppMountParameters, CoreSetup, CoreStart, Plugin } from 'kibana/public';
import { StartPlugins, PluginStart, SetupPlugins, PluginSetup } from './types';
import { PLUGIN_NAME } from '../common';
import { ObjectFieldFormat } from './field_formatters/ObjectFieldFormat';
import { ObjectFieldFormatEditor } from './field_formatters/ObjectFieldFormatEditor';
import { fieldMapper } from './field_mapper';

export class KibanaObjectFormatPlugin
  implements Plugin<PluginSetup, PluginStart, SetupPlugins, StartPlugins> {
  public setup(core: CoreSetup<StartPlugins, PluginStart>, pluginSetup: SetupPlugins): PluginSetup {
    pluginSetup.indexPatternManagement.fieldFormatEditors.register(ObjectFieldFormatEditor);

    core.getStartServices().then(([{ uiSettings }, { data }]) => {
      data.fieldFormats.register([ObjectFieldFormat]);
      const indexPatterns = data?.indexPatterns;

      ((getFieldsForWildcardCached) => {
        indexPatterns.getFieldsForWildcard = async (options: any) => {
          const fields = await getFieldsForWildcardCached(options);

          let indexPattern = { id: 'fake-id', title: ''}; // TO-DO - Need to find selected index pattern and feed it into fieldMapper Function
          return fieldMapper({ uiSettings, fields, indexPattern });
        };
      })(indexPatterns.getFieldsForWildcard);
    });

    // Register an application into the side navigation menu
    core.application.register({
      id: 'kibanaObjectFormat',
      title: PLUGIN_NAME,
      async mount(params: AppMountParameters) {
        // Load application bundle
        const { renderApp } = await import('./application');
        // Get start services as specified in kibana.json
        const [coreStart, depsStart] = await core.getStartServices();
        // Render the application

        return renderApp(coreStart, depsStart as StartPlugins, params);
      },
    });

    // Return methods that should be available to other plugins
    return {};
  }

  public start(core: CoreStart): PluginStart {
    return {};
  }

  public stop() {}
}
