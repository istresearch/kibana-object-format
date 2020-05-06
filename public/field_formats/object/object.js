import _ from 'lodash';
import { FieldFormat } from '../../../../../src/plugins/data/public';
import { getHighlightHtml } from '../../common/highlight';
import { lodashOopMixin } from '../../common/lodash-mixins/oop';
import { lodashGetPluckMixin } from '../../common/lodash-mixins/get_pluck';
import cleanTemplate from '../../common/clean-template';
import { DEFAULT_VALUES, ID, TITLE, FIELD_TYPE } from './constants';
import format_html from './templates/object_format.html';
import image_html from './templates/object_image.html';
import link_html from './templates/object_link.html';
import text_html from './templates/object_text.html';
import empty_html from './templates/object_empty.html';
import './object.less';

lodashOopMixin(_);
lodashGetPluckMixin(_);
cleanTemplate(false);

const vis_template = _.template(format_html);
const image_template = _.template(image_html);
const link_template = _.template(link_html);
const text_template = _.template(text_html);
const empty_template = _.template(empty_html);


export class ObjectFormat extends FieldFormat {
  constructor(params) {
    super(params);
  }

  static id = ID;
  static title = TITLE;
  static fieldType = FIELD_TYPE;

  getParamDefaults() {
    return {
      fieldType: null, // populated by editor, see controller
      basePath: null, // If multiple fields should be grouped, this is the common parent
      limit: null, // // If basePath is an array, this is the max we will show
      fields: [{ ...DEFAULT_VALUES }],
    };
  }

  _getFieldModels(value, field, hit, basePath, objectFields) {
    let filtered = false;
    const fields = [];

    // Apply each field configured for the formatter to the value
    _.forEach(
      objectFields,
      _.bind(function(objectField) {
        let label = '';
        let fieldPath = '';

        if (objectField.label) label = objectField.label + ': ';
        if (objectField.path) fieldPath = objectField.path;
        if (objectField.filtered) filtered = objectField.filtered;

        // Get the value from the field path
        let fieldValues = _.getPluck(value, fieldPath);

        if (objectField.type === 'text') {
          // We generate a nice comma delimited list, like the built in String does.
          if (_.isArray(fieldValues)) {
            if (objectField.limit) {
              fieldValues = _.slice(fieldValues, 0, objectField.limit);
            }

            fieldValues = _(fieldValues)
              .map(item => (_.isObject(item) ? JSON.stringify(item) : item))
              .join(', ');
          } else if (_.isObject(fieldValues)) {
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

        const fullPath = this._getFullPath(basePath, field, objectField.path, null);
        const filterPath = this._getFullPath(
          basePath,
          field,
          objectField.path,
          objectField.filterField
        );
        const valueModels = [];

        _.forEach(
          fieldValues,
          _.bind(function(fieldValue) {
            const valueModel = {
              value: fieldValue,
              display: _.escape(fieldValue),
            };

            if (hit && hit.highlight && hit.highlight[fullPath]) {
              valueModel.display = getHighlightHtml(valueModel.display, hit.highlight[fullPath]);
            } else if (hit && hit.highlight && hit.highlight[filterPath]) {
              valueModel.display = getHighlightHtml(valueModel.display, hit.highlight[filterPath]);
            }

            valueModels.push(valueModel);
          }, this)
        );

        const fieldHtml = this._fieldToHtml({
          label: label,
          formatType: objectField.type,
          values: valueModels,
          width: objectField.width,
          height: objectField.height,
          filterField: objectField.filterField,
        });

        fields.push({
          formatType: objectField.type,
          label: label,
          html: fieldHtml,
        });
      }, this)
    );

    return { filtered: filtered, fields: fields };
  }

  _fieldToHtml(fieldModel) {
    let html = null;

    switch (fieldModel.formatType) {
      case 'image':
        html = image_template({ field: fieldModel });
        break;

      case 'link':
        html = link_template({ field: fieldModel });
        break;

      case 'text':
      default:
        html = text_template({ field: fieldModel });
        break;
    }

    return html;
  }

  _getFullPath(basePath, field, valuePath, filterField) {
    const parts = [field.name];

    if (basePath) {
      parts.push(basePath);
    }

    parts.push(valuePath);

    if (filterField) {
      parts.push(filterField);
    }

    return parts.join('.');
  }

  asPrettyString(val) {
    if (val === null || val === undefined) return ' - ';
    switch (typeof val) {
      case 'string':
        return val;
      case 'object':
        return JSON.stringify(val, null, '  ');
      default:
        return '' + val;
    }
  }

  htmlConvert = (val, options = {}) => {
    const { field, hit } = options;

    const basePath = this.param('basePath');
    const objectFields = this.param('fields');
    const limit = this.param('limit');

    if (basePath) {
      val = _.get(val, basePath);
    }

    if (!_.isArray(val)) {
      val = [val];
    }

    // Filter out any null or empty entries
    val = $.grep(val, function(n) {
      return n === 0 || n;
    });

    // If we have a limit on this list, impose it now
    if (limit) {
      val = _.slice(val, 0, limit);
    }

    if (val.length > 0) {
      const htmlSnippets = [];

      _.forEach(
        val,
        _.bind(function(value) {
          if (value) {
            const fieldModels = this._getFieldModels(value, field, hit, basePath, objectFields);
            htmlSnippets.push(
              vis_template({
                filtered: fieldModels.filtered,
                fields: fieldModels.fields,
                uid: Math.floor(Math.random() * 1000000 + 1),
              })
            );
          }
        }, this)
      );

      return htmlSnippets.join('\n');
    } else {
      return empty_template();
    }
  };

  textConvert = rawValue => {
    return this.asPrettyString(rawValue);
  };
}
