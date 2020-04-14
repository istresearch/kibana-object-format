import _ from 'lodash';
import { uiModules } from 'ui/modules';

const DEFAULT_CONFIG =
  '{\n  "index_pattern": {\n    "*": {\n' +
  '"include": [],\n      "exclude": [".*"]\n    }\n  }\n}';

const app = uiModules.get('apps/management');

app.run([
  'config',
  '$rootScope',
  '$timeout',
  function(config, $rootScope, $timeout) {
    let settings = config.get('fieldMapperHack:fields', DEFAULT_CONFIG);
    settings = settings.index_pattern;

    $rootScope.$on('$routeChangeSuccess', function(_$event, next) {
      const indexPattern = next && next.locals && next.locals.indexPattern;
      if (indexPattern && indexPattern.fieldsFetcher && indexPattern.fieldsFetcher.fetch) {
        indexPattern.fieldsFetcher.fetch = indexPattern => {
          let paths = [];
          const mappingNames = [];

          const { fields } = indexPattern;

          // 1) Iterate the field names, identify the "parent" paths
          _.forEach(fields, field => {
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
          let match = { includes: [], excludes: [] };

          if (_.has(settings, indexPattern.id)) {
            match = settings[indexPattern.id];
          } else if (_.has(settings, '*')) {
            match = settings['*'];
          }

          const included = [];
          const excluded = [];

          _.forEach(match.include, expression => {
            _.forEach(paths, path => {
              if (path.match(expression)) {
                included.push(path);
              }
            });
          });

          _.forEach(match.exclude, expression => {
            _.forEach(included, path => {
              if (path.match(expression)) {
                excluded.push(path);
              }
            });
          });

          // 3) Add a field mapping for the missing parents
          _.forEach(_.difference(included, excluded), path => {
            fields.push({
              name: path,
              aggregatable: false,
              searchable: true,
              analyzed: false,
              doc_values: false,
              indexed: true,
              type: 'string',
            });
          });

          // Triggers a refresh of the table after the update is made.
          $timeout(() => {
            $rootScope.$apply();
          }, 0);

          return fields;
        };
      }
    });
  },
]);
