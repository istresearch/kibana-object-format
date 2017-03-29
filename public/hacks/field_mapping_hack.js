import _ from 'lodash';
import angular from 'angular';
import 'ui/courier';
import 'ui/index_patterns';
import uiModules from 'ui/modules';

let app = uiModules.get('kibana/courier',
                        'kibana/index_patterns');

app.run(function(courier) {

    let indexPatterns = courier.indexPatterns;
    let mapper = indexPatterns.mapper;

    let fieldsFunc = mapper.getFieldsForIndexPattern;

    (function(fieldsFunc) { // Cache the original method
        mapper.getFieldsForIndexPattern = function() { // Redefine the method

            let indexPattern = arguments[0]
            let skipIndexPatternCache = arguments[1]

            let promise = fieldsFunc.apply(this, arguments);

            return promise.then(fields => {

                fields.push({
                    name: "meta.twitter",
                    aggregatable: false,
                    searchable: false,
                    analyzed: false,
                    doc_values: false,
                    indexed: false,
                    type: "string"
                });

                fields.push({
                    name: "meta.images",
                    aggregatable: false,
                    searchable: false,
                    analyzed: false,
                    doc_values: false,
                    indexed: false,
                    type: "string"
                });

                // Update the cache since we edited the list
                mapper.cache.set(indexPattern.id, fields);

                return fields;
            });
        };
    })(fieldsFunc);
});

