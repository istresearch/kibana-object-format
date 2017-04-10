import _ from 'lodash';
import IndexPatternsFieldFormatProvider from 'ui/index_patterns/_field_format/field_format';
import { getHighlightHtml } from 'ui/highlight';
import './editors/object.less';
import objectTemplate from './editors/object.html';

function ObjectFormatProvider(Private) {

    require('ui/utils/lodash-mixins/oop')(_);
    require('ui/utils/lodash-mixins/string')(_);
    require('./lib/lodash-mixins/get_pluck')(_);

    const FieldFormat = Private(IndexPatternsFieldFormatProvider);
    const convertTemplate = _.template(require('./templates/object_format.html'))
    const DEFAULT_VALUES = {
        label: null,
        path: null,
        type: 'text',
        filtered: true,
        filter_field: 'keyword',
        height: null,
        width: null
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
        basePath: null,
        fields: [_.cloneDeep(DEFAULT_VALUES)]
    };

    _ObjectFormat.prototype._convert = {
        text(val) {
            return _.asPrettyString(val);
        },
        html(val, field, hit) { // TODO hit highlighting
            let basePath = this.param('basePath');
            let objectFields = this.param('fields');
            let flattened_fields = [];

            // Get the flattened fields from the configuration, for highlighting
            _.forEach(objectFields, function(config_field) {
                if (config_field.path) {
                    let parts = [field.name]

                    if (basePath) {
                        parts.push(basePath)
                    }

                    parts.push(config_field.path);

                    if (config_field.filter_field) {
                        parts.push(config_field.filter_field);
                    }

                    flattened_fields.push(parts.join('.'))
                }
            });

            if (basePath) {
                val = _.get(val, basePath);
            }

            if (!_.isArray(val)) {
                val = [val];
            }

            let results = [];

            _.forEach(val, function(subval){

                let fields = [];

                _.forEach(objectFields, function(field) {
                    let label = '';
                    let fieldPath = '';

                    if (field.label) label = field.label + ": ";
                    if (field.path) fieldPath = field.path;

                    let fieldValues = _.getPluck(subval, fieldPath);

                    switch (field.type) {
                        case 'text':
                            if (_.isArray(fieldValues)) {
                                fieldValues = _(fieldValues)
                                    .map( item => ( _.isObject(item) ? JSON.stringify(item) : item) )
                                    .join(', ');
                            }
                            else if (_.isObject(fieldValues)) {
                                fieldValues = JSON.stringify(fieldValues)
                            }
                            break;

                        default:
                            break;
                    }

                    if (!_.isArray(fieldValues)) {
                        fieldValues = [fieldValues]
                    }

                    fields.push({
                        label: label,
                        formatType: field.type,
                        values: fieldValues,
                        width: field.width,
                        height: field.height,
                        filter_field: field.filter_field
                    });
                });

                let html = convertTemplate({fields});

                _.forEach(flattened_fields, function(field_path) {
                    if (hit && hit.highlight && hit.highlight[field_path]) {
                        html = getHighlightHtml(html, hit.highlight[field_path]);
                    }
                });

                results.push(html);

            });

            return results.join('\n');
        }
    };

    return _ObjectFormat;
}

require('ui/registry/field_formats').register(ObjectFormatProvider);