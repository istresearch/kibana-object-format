import { RegistryFieldFormatsProvider } from 'ui/registry/field_formats';
import _ from 'lodash';
import { IndexPatternsFieldFormatProvider } from 'ui/index_patterns/_field_format/field_format';
import { getHighlightHtml } from 'ui/highlight';
import './editors/object.less';

import objectTemplate from './editors/object.html';
import format_html from './templates/object_format.html';
import image_html from './templates/object_image.html';
import link_html from './templates/object_link.html';
import text_html from './templates/object_text.html';

import { lodashOopMixin } from 'ui/utils/lodash-mixins/oop';
import { lodashStringMixin } from 'ui/utils/lodash-mixins/string';
import { lodashGetPluckMixin } from './lib/lodash-mixins/get_pluck';

function ObjectFormatProvider(Private) {

    lodashOopMixin(_);
    lodashStringMixin(_);
    lodashGetPluckMixin(_);

    const FieldFormat = Private(IndexPatternsFieldFormatProvider);
    const vis_template = _.template(format_html)
    const image_template = _.template(image_html)
    const link_template = _.template(link_html)
    const text_template = _.template(text_html)

    const DEFAULT_VALUES = {
        label: null, // Optional data label
        path: null, // Dot notated location of the value within the object, relative to basePath
        type: 'text',
        filtered: true, // To enable the filtering on cell click
        filterField: null, // If the data is analyzed, and there is a keyword subfield we can use for the filter
        height: null, // Image dimension in px
        width: null, // Image dimension in px
        limit: null // If presenting an array, this is the max we will show
    };

    _.class(_ObjectFormat).inherits(FieldFormat);

    function _ObjectFormat(params) {
        _ObjectFormat.Super.call(this, params);
    }

    _ObjectFormat.id = 'ist-object';
    _ObjectFormat.title = 'Object';
    _ObjectFormat.fieldType = [
        'string',
        'unknown'
    ];

    _ObjectFormat.formatTypes = [
        { id: 'text', name: 'Text' },
        { id: 'link', name: 'Link' },
        { id: 'image', name: 'Image' }
    ];

    _ObjectFormat.editor = {
        template: objectTemplate,
        controller($scope) {

            $scope.$watch('editor.field.type', type => {
                $scope.editor.formatParams.fieldType = type;
            });

            $scope.addField = function () {
                $scope.editor.formatParams.fields.push(_.cloneDeep(DEFAULT_VALUES));
            };

            $scope.removeField = function (index) {
                $scope.editor.formatParams.fields.splice(index, 1);
            };
        }
    };

    _ObjectFormat.paramDefaults = {
        fieldType: null, // populated by editor, see controller above
        basePath: null, // If multiple fields should be grouped, this is the common parent
        limit: null, // // If basePath is an array, this is the max we will show
        fields: [_.cloneDeep(DEFAULT_VALUES)]
    };

    _ObjectFormat.prototype._convert = {
        text(val) {
            return _.asPrettyString(val);
        },
        html(val, field, hit) {
            let basePath = this.param('basePath');
            let objectFields = this.param('fields');
            let limit = this.param('limit');

            if (basePath) {
                val = _.get(val, basePath);
            }

            if (!_.isArray(val)) {
                val = [val];
            }

            // If we have a limit on this list, impose it now
            if (limit) {
                val = _.slice(val, 0, limit);
            }

            let htmlSnippets = [];

            _.forEach(val, function(value){
                let fieldModels = _get_field_models(value, field, hit, basePath, objectFields);
                htmlSnippets.push(vis_template({filtered: fieldModels.filtered,
                                                fields: fieldModels.fields}));
            });

            return htmlSnippets.join('\n');
        }
    };

    const _get_field_models = function (value, field, hit, basePath, objectFields) {

        let filtered = false;
        let fields = [];

        // Apply each field configured for the formatter to the value
        _.forEach(objectFields, function(objectField) {
            let label = '';
            let fieldPath = '';

            if (objectField.label) label = objectField.label + ": ";
            if (objectField.path) fieldPath = objectField.path;
            if (objectField.filtered) filtered = objectField.filtered;

            // Get the value from the field path
            let fieldValues = _.getPluck(value, fieldPath);

            if (objectField.type == 'text') {
                // We generate a nice comma delimited list, like the built in String does.
                if (_.isArray(fieldValues)) {
                    if (objectField.limit) {
                        fieldValues = _.slice(fieldValues, 0, objectField.limit);
                    }

                    fieldValues = _(fieldValues)
                        .map( item => ( _.isObject(item) ? JSON.stringify(item) : item) )
                        .join(', ');
                }
                else if (_.isObject(fieldValues)) {
                    fieldValues = JSON.stringify(fieldValues);
                }
            }

            if (!_.isArray(fieldValues)) {
                fieldValues = [fieldValues];
            }

            // If we have a limit on lists, impose it now
            if (objectField.limit) {
                fieldValues = _.slice(fieldValues, 0, objectField.limit);
            }

            let fullPath = _get_full_path(basePath, field, objectField.path, null);
            let filterPath = _get_full_path(basePath, field, objectField.path, objectField.filterField);
            let valueModels = [];

            _.forEach(fieldValues, function(fieldValue) {

                let valueModel = {
                    value: fieldValue,
                    display: _.escape(fieldValue)
                };

                if (hit && hit.highlight && hit.highlight[fullPath]) {
                    valueModel.display = getHighlightHtml(valueModel.display, hit.highlight[fullPath]);
                }
                else if (hit && hit.highlight && hit.highlight[filterPath]) {
                    valueModel.display = getHighlightHtml(valueModel.display, hit.highlight[filterPath]);
                }

                valueModels.push(valueModel);
            });

            let fieldHtml = _field_to_html({
                label: label,
                formatType: objectField.type,
                values: valueModels,
                width: objectField.width,
                height: objectField.height,
                filterField: objectField.filterField
             });

            fields.push({
                formatType: objectField.type,
                label: label,
                html: fieldHtml
            });
        });

        return {filtered: filtered, fields: fields};
    };

    const _field_to_html = function (fieldModel) {

        let html = null;

        switch (fieldModel.formatType) {
            case 'image':
                html = image_template({field: fieldModel})
                break;

            case 'link':
                html = link_template({field: fieldModel})
                break;

            case 'text':
            default:
                html = text_template({field: fieldModel})
                break;
        }

        return html;
    };

    const _get_full_path = function (basePath, field, valuePath, filterField) {

        let parts = [field.name];

        if (basePath) {
            parts.push(basePath);
        }

        parts.push(valuePath);

        if (filterField) {
            parts.push(filterField);
        }

        return parts.join('.');
    };

    return _ObjectFormat;
}

RegistryFieldFormatsProvider.register(ObjectFormatProvider);