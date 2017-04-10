import _ from 'lodash';
import angular from 'angular';
import 'ui/courier';
import 'ui/index_patterns';
import uiModules from 'ui/modules';
import defaultSettings from './settings/defaults';
import FilterManagerProvider from 'ui/filter_manager';
import RegistryFieldFormatsProvider from 'ui/registry/field_formats';

let app = uiModules.get('kibana/courier',
                        'kibana/index_patterns');

/**
 * Add an entry to the Advanced Settings table.
 */
app.run(function(config) {

    const settings = defaultSettings();

    _.forIn(settings, function(value, key){

        if (!config.isDeclared(key)) {
            config.set(key, value['value']);
        }

        // If the user deletes entry from the UI, set the default value again
        config.watch(key, function(newVal, huh, key, config) {
            if (newVal === undefined) {
                config.set(key, settings[key]['value']);
            }
        });
    })
});

/**
 * Patch 'mapper.getFieldsForIndexPattern' to allow us to insert additional fields.
 */
app.run(function(courier, config) {

    let indexPatterns = courier.indexPatterns;
    let mapper = indexPatterns.mapper;

    let fieldsFunc = mapper.getFieldsForIndexPattern;

    (function(fieldsFunc) { // Cache the original method
        mapper.getFieldsForIndexPattern = function() { // Wrap the method

            let indexPattern = arguments[0]
            let skipIndexPatternCache = arguments[1]

            // If we're going to get a cache hit, just use it
            let cache = mapper.cache.get(indexPattern.id);
            if (cache) return Promise.resolve(cache);

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
                let settings = config.get('fieldMapperHack:fields');
                settings = JSON.parse(settings)['index_pattern'];

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
                        searchable: false,
                        analyzed: false,
                        doc_values: false,
                        indexed: true,
                        type: "string"
                    });
                });

                // Update the mapper cache since we edited the list
                mapper.cache.set(indexPattern.id, fields);

                return fields;
            });
        };
    })(fieldsFunc);
});

/**
 * Patch 'FilterManager' to allow us to hand-craft filters for fields
 * that use the Object formatter.
 */
app.run(function(config, Private) {

    const filterManager = Private(FilterManagerProvider);
    const _ObjectFormat = Private(RegistryFieldFormatsProvider).getType('ist-object');

    let addFunc = filterManager.add;

    (function(addFunc) { // Cache the original method
        filterManager.add = function() { // Wrap the method

            let field = arguments[0];
            let values = arguments[1];
            let operation = arguments[2];
            let index = arguments[3];

            // If the field is one of our special Object fields
            if (field && field.format && field.format.type === _ObjectFormat) {
                let params = field.format._params;
                let basePath = params.basePath;
                let filters = null;

                if (!_.isArray(values)) {
                    values = [values];
                }

                _.forEach(values, function(value) {
                    if (basePath) {
                        value = _.get(value, basePath);
                    }

                    if (!_.isArray(value)) {
                        value = [value];
                    }

                    _.forEach(params.fields, function(fieldEntry) {
                        if (fieldEntry.filtered) {
                            let path = fieldEntry.path;
                            let entry_values = [];

                            _.forEach(value, function(value_entry) {

                                let plucked = _.getPluck(value_entry, path);

                                if (_.isArray(plucked)) {
                                    _.forEach(plucked, function(v) {
                                        entry_values.push(v);
                                    });
                                }
                                else {
                                    entry_values.push(plucked);
                                }
                            });

                            path = basePath ? [field.name, basePath, path].join('.') : [field.name, path].join('.');

                            if (fieldEntry.filter_field) {
                                path = [path, fieldEntry.filter_field].join('.');
                            }

                            filters = addFunc.apply(this, [path, entry_values, operation, index]);
                        }
                    });
                });

                return filters;
            }
            else {
                return addFunc.apply(this, arguments);
            }
        };
    })(addFunc);
});