import _ from 'lodash';
import IndexPatternsFieldFormatProvider from 'ui/index_patterns/_field_format/field_format';

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
        type: 'text'
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
        html(val) {
            let basePath = this.param('basePath');
            let objectFields = this.param('fields');

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
                        values: fieldValues
                    });
                });

                results.push(convertTemplate({fields}));
            });

            return results.join('\n');
        }
    };

    return _ObjectFormat;
}

require('ui/registry/field_formats').register(ObjectFormatProvider);