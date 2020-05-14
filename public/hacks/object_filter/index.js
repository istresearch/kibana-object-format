import { uiModules } from 'ui/modules';
import { npStart } from 'ui/new_platform';
import objectFilter from './objectFilter';
 
const app = uiModules.get('kibana');
const { filterManager } = npStart.plugins.data.query;

app.run(['config', (_config) => {
  filterManager.register(objectFilter);
}]);