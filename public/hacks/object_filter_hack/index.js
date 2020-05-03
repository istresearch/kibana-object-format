import { uiModules } from 'ui/modules';
import { npStart } from 'ui/new_platform';
const app = uiModules.get('kibana');
const { filterManager } = npStart.plugins.data.query;
import objectFilter from './objectFilter';

app.run(['config', function(_config) {
  filterManager.register(objectFilter);
}]);