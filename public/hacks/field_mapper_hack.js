import _ from 'lodash';
import angular from 'angular';
import 'ui/courier';
import 'ui/index_patterns';
import 'ui/modals/confirm_modal_promise';
import { uiModules } from 'ui/modules';

let app = uiModules.get('app/kibana-object-formatter', [
        'kibana/index_patterns'
    ]);

/**
 * Patch 'fieldsFetcher.fetch' to allow us to insert additional fields.
 */
app.run(['indexPatterns', 'config', function(indexPatterns, config) {

    let fieldsFetcher = indexPatterns.fieldsFetcher;
    let fieldsFunc = fieldsFetcher.fetch;

    (function(fieldsFunc) { // Cache the original method
        fieldsFetcher.fetch = function() { // Wrap the method

            let indexPattern = arguments[0]

            let promise = fieldsFunc.apply(this, arguments);

            return promise.then(fields => {

                let paths = [];
                let mappingNames = [];

                // 1) Iterate the field names, identify the "parent" paths
                _.forEach(fields, function(field) {

                    let fieldName = field["name"];
                    mappingNames.push(fieldName);

                    let parts = fieldName.split(".");

                    while (parts.length > 1) {
                        parts.pop();
                        paths.push(parts.join("."));
                    }
                });

                paths = _.uniq(_.difference(paths, mappingNames));

                // 2) Test the discovered field names against the configuration
                let defaultConfig = "{\n  \"index_pattern\": {\n    \"*\": {\n      \"include\": [],\n      \"exclude\": [\".*\"]\n    }\n  }\n}"
                let settings = config.get('fieldMapperHack:fields', defaultConfig);
                settings = settings['index_pattern'];

                let match = { includes: [], excludes: []};

                if (_.has(settings, indexPattern.id)) {
                    match = settings[indexPattern.id];
                }
                else if (_.has(settings, '*')) {
                    match = settings['*'];
                }

                let included = []
                let excluded = []

                _.forEach(match['include'], function(expression){
                    _.forEach(paths, function(path){
                        if (path.match(expression)) {
                            included.push(path);
                        }
                    });
                });

                _.forEach(match['exclude'], function(expression){
                    _.forEach(included, function(path){
                        if (path.match(expression)) {
                            excluded.push(path);
                        }
                    });
                });

                // 3) Add a field mapping for the missing parents
                _.forEach(_.difference(included, excluded), function(path){
                    fields.push({
                        name: path,
                        aggregatable: false,
                        searchable: true,
                        analyzed: false,
                        doc_values: false,
                        indexed: true,
                        type: "string"
                    });
                });

                return fields;
            });
        };
    })(fieldsFunc);
}]);
