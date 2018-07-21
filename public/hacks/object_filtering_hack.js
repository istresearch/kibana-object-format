import _ from 'lodash';
import 'ui/courier';
import { uiModules } from 'ui/modules';
import { FilterManagerProvider } from 'ui/filter_manager';
import { fieldFormats } from 'ui/registry/field_formats';

const app = uiModules.get('app/kibana-object-formatter');

/**
 * Patch 'FilterManager' to allow us to hand-craft filters for fields
 * that use the Object formatter.
 */
app.run(function (config, Private) {

    const filterManager = Private(FilterManagerProvider);
    const _ObjectFormat = fieldFormats.getType('ist-object');

    const addFunc = filterManager.add;

    (function (addFunc) { // Cache the original method
        filterManager.add = function () { // Wrap the method

            const field = arguments[0];
            let values = arguments[1];
            const operation = arguments[2];
            const index = arguments[3];

            // If the field is one of our special Object fields
            if (field && field.format && field.format.type === _ObjectFormat) {
                const params = field.format._params;
                const basePath = params.basePath;
                let filters = null;

                if (!_.isArray(values)) {
                    values = [values];
                }

                _.forEach(values, function (value) {
                    if (basePath) {
                        value = _.get(value, basePath);
                    }

                    if (!_.isArray(value)) {
                        value = [value];
                    }

                    _.forEach(params.fields, _.bind(function (fieldEntry) {
                        if (fieldEntry.filtered) {
                            let path = fieldEntry.path;
                            const entryValues = [];

                            _.forEach(value, function (valueEntry) {

                                const plucked = _.getPluck(valueEntry, path);

                                if (_.isArray(plucked)) {
                                    _.forEach(plucked, function (v) {
                                        if (v) {
                                            entryValues.push(v);
                                        }
                                    });
                                }
                                else {
                                    if (plucked) {
                                        entryValues.push(plucked);
                                    }
                                }
                            });

                            path = basePath ? [field.name, basePath, path].join('.') : [field.name, path].join('.');

                            if (fieldEntry.filterField) {
                                path = [path, fieldEntry.filterField].join('.');
                            }

                            filters = addFunc.apply(this, [path, entryValues, operation, index]);
                        }
                    }, filterManager));
                });

                return filters;
            }
            else {
                return addFunc.apply(this, arguments);
            }
        };
    })(addFunc);
});