import './index.scss';

import { KibanaObjectFormatPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, Kibana Platform `plugin()` initializer.
export function plugin() {
  return new KibanaObjectFormatPlugin();
}
export { StartPlugins, SetupPlugins, PluginSetup, PluginStart } from './types';
export * from './utils';