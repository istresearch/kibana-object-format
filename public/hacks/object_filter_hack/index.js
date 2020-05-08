import { uiModules } from 'ui/modules';
import { npStart } from 'ui/new_platform';
import objectFilter, { popover } from './objectFilter';
 
const app = uiModules.get('kibana');
const { filterManager } = npStart.plugins.data.query;

app.run(['$rootScope', ($rootScope) => {
  filterManager.register(objectFilter);

  $rootScope.$on('$routeChangeSuccess', (_$event, next) => {
    const {
      $$route: { originalPath },
    } = next;
 
    if (popover.isInit()) {
      popover.destroy();
    }

    if (originalPath.indexOf('/discover/') !== -1) {
      popover.init();
    }
  });
}]);