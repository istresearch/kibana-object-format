import { PluginInitializerContext } from '../../../src/core/server';
import { KibanaObjectFormatPlugin } from './plugin';

//  This exports static code and TypeScript types,
//  as well as, Kibana Platform `plugin()` initializer.

export function plugin(initializerContext: PluginInitializerContext) {
  return new KibanaObjectFormatPlugin(initializerContext);
}

export { KibanaObjectFormatPluginSetup, KibanaObjectFormatPluginStart } from './types';
