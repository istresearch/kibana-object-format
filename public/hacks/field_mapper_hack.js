import _ from 'lodash';
import { uiModules } from 'ui/modules';
import { npStart } from 'ui/new_platform';
const { indexPatterns } = npStart.plugins.data;

const app = uiModules.get('apps/management');

app.run([
  'config',
  '$rootScope',
  '$timeout',
  function(config, $rootScope, $timeout) {
    $rootScope.$on('$routeChangeSuccess', function(_$event, next) {
      const fieldsFetcher = _.get(next, 'locals.indexPattern.fieldsFetcher', null);
      
      if (fieldsFetcher) {
        const { fetch: fieldsFunc } = fieldsFetcher;
        (function(fieldsFunc) {
          fieldsFetcher.fetch = () => {

            let indexPattern = {};

            indexPatterns.getFields(['id', 'title']).then(ipList => {
              const ipTitle = $('.euiTitle').text().trim();
              const ip = ipList.filter(ipItem => ipItem.title === ipTitle);
              if (ip.length === 1) {
                indexPattern = ip[0];
              }
            })

            const promise = fieldsFunc.apply(this, arguments);

            return promise.then(fields => {  
              let paths = [];
              const mappingNames = [];

              // 1) Iterate the field names, identify the "parent" paths
              _.forEach(fields, function (field) {

                  const fieldName = field.name;
                  mappingNames.push(fieldName);

                  const parts = fieldName.split('.');

                  while (parts.length > 1) {
                      parts.pop();
                      paths.push(parts.join('.'));
                  }
              });

              paths = _.uniq(_.difference(paths, mappingNames));

              // 2) Test the discovered field names against the configuration
              const defaultConfig = '{\n  \"index_pattern\": {\n    \"*\": {\n' +
                    '\"include\": [],\n      \"exclude\": [\".*\"]\n    }\n  }\n}';
              let { index_pattern: settings } = config.get('fieldMapperHack:fields', defaultConfig);
              let match = { includes: [], excludes: [] };

              if (_.has(settings, indexPattern.id)) {
                  match = settings[indexPattern.id];
              }
              else if (_.has(settings, '*')) {
                  match = settings['*'];
              }

              const included = [];
              const excluded = [];

              _.forEach(match.include, function (expression) {
                  _.forEach(paths, function (path) {
                      if (path.match(expression)) {
                          included.push(path);
                      }
                  });
              });

              _.forEach(match.exclude, function (expression) {
                  _.forEach(included, function (path) {
                      if (path.match(expression)) {
                          excluded.push(path);
                      }
                  });
              });

              // 3) Add a field mapping for the missing parents
              _.forEach(_.difference(included, excluded), function (path) {
                  fields.push({
                      name: path,
                      aggregatable: false,
                      searchable: true,
                      analyzed: false,
                      doc_values: false,
                      indexed: true,
                      type: 'string'
                  });
              });

              $timeout(() => {
                $rootScope.$apply();
              }, 0);

              return fields;
            });
          };
        })(fieldsFunc);
      }
    });
  },
]);
