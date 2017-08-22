import _ from 'lodash';
import angular from 'angular';
import 'ui/courier';
import { uiModules } from 'ui/modules';
import { FilterManagerProvider } from 'ui/filter_manager';
import { RegistryFieldFormatsProvider } from 'ui/registry/field_formats';

let app = uiModules.get('kibana/courier');

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
                                        if (v) {
                                            entry_values.push(v);
                                        }
                                    });
                                }
                                else {
                                    if (plucked) {
                                        entry_values.push(plucked);
                                    }
                                }
                            });

                            path = basePath ? [field.name, basePath, path].join('.') : [field.name, path].join('.');

                            if (fieldEntry.filterField) {
                                path = [path, fieldEntry.filterField].join('.');
                            }

                            // TODO Validate       var field = indexPattern.fields.byName[path];

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