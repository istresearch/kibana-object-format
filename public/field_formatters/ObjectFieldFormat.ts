import { HtmlContextTypeConvert, TextContextTypeConvert } from 'src/plugins/data/common/field_formats/types';
import { FieldFormat } from '../../../../src/plugins/data/public';
import { get, isObject, escape, isArray, compact, slice, template, TemplateExecutor } from 'lodash';
import { asPrettyString, getFullPath, getPluck } from '../utils';
import formatHTML from './templates/object_format.html';
import imageHTML from './templates/object_image.html';
import linkHTML from './templates/object_link.html';
import textHTML from './templates/object_text.html';
import emptyHTML from './templates/object_empty.html';

const DEFAULT_VALUES = {
  label: null, // Optional data label
  path: null, // Dot notated location of the value within the object, relative to basePath
  type: 'text',
  filtered: true, // To enable the filtering on cell click
  dHashField: null,
  filterField: null, // If the data is analyzed, and there is a keyword subfield we can use for the filter
  height: null, // Image dimension in px
  width: null, // Image dimension in px
  limit: null, // If presenting an array, this is the max we will show
};

export class ObjectFieldFormat extends FieldFormat {
  static id = 'ist-object';
  static title = 'Object';
  static fieldType = ['string'];

  getParamDefaults() {
    return {
      fieldType: null, // populated by editor, see controller
      basePath: null, // If multiple fields should be grouped, this is the common parent
      limit: null, // // If basePath is an array, this is the max we will show
      similarityScript: null,
      fields: [{ ...DEFAULT_VALUES }],
    };
  }

  private fieldToHtml(field: any) {
    let tmplhtml: TemplateExecutor;

    switch (field.formatType) {
      case 'image':
        tmplhtml = template(imageHTML);
        break;
      case 'link':
        tmplhtml = template(linkHTML);
        break;
      case 'text':
        tmplhtml = template(textHTML);
        break;
      default:
        tmplhtml = template(textHTML);
    }

    return tmplhtml({ field });
  }

  private getFieldModels({
    value = {},
    field = {},
    hit,
    basePath,
    objectFields,
  }: {
    value: any;
    field: any;
    hit?: any;
    basePath?: string;
    objectFields: any;
  }) {
    const fields = [];

    for (let objectField of objectFields) {
      const {
        path = '',
        label,
        limit,
        type,
        filterField,
        filtered = false,
        width,
        height,
      } = objectField;

      let fieldValues = getPluck(value, path);

      if (type === 'text') {
        if (isArray(fieldValues)) {
          if (objectField.limit) {
            fieldValues = slice(fieldValues, 0, objectField.limit);
          }

          fieldValues = fieldValues
            .map((fieldValue: string) =>
              isObject(fieldValue) ? JSON.stringify(fieldValue) : fieldValue
            )
            .join(', ');
        } else if (isObject(fieldValues)) {
          fieldValues = JSON.stringify(fieldValues);
        }
      }

      if (!isArray(fieldValues)) {
        fieldValues = [fieldValues];
      }

      if (limit) {
        fieldValues = slice(fieldValues, 0, limit);
      }

      const fullPath = getFullPath({ basePath, field, path });

      const filterPath = getFullPath({
        basePath,
        field,
        path,
        filterField,
      });

      const valueModels = [];

      for (let fieldValue of fieldValues) {
        const valueModel = {
          value: fieldValue,
          display: escape(fieldValue),
        };

        valueModels.push(valueModel);
      }

      const html = this.fieldToHtml({
        label: `${label}:`,
        formatType: type,
        values: valueModels,
        width,
        height,
        filterField,
      });

      fields.push({
        formatType: type,
        label: `${label}:`,
        html,
      });

      return { filtered: filtered, fields: fields };
    }
  }

  htmlConvert: HtmlContextTypeConvert = (rawValue, options = {}) => {
    const { field, hit } = options;
    const visTemplate = template(formatHTML);
    const basePath = this.param('basePath');
    const objectFields = this.param('fields');
    const limit = this.param('limit');

    if (basePath) {
      rawValue = get(rawValue, basePath);
    }

    if (!isArray(rawValue)) {
      rawValue = [rawValue];
    }

    // Filter out any null or empty entries
    rawValue = compact(rawValue);

    if (limit) {
      rawValue = slice(rawValue, 0, limit);
    }

    if (rawValue.length > 0) {
      const htmlSnippets = [];

      for (let value of rawValue) {
        if (value) {
          const fieldModels = this.getFieldModels({ value, field, hit, basePath, objectFields });

          htmlSnippets.push(
            visTemplate({
              ...fieldModels,
              uid: Math.floor(Math.random() * 1000000 + 1),
            })
          );
        }
      }

      return htmlSnippets.join('\n');
    } else {
      return '-';
    }
  };

  textConvert: TextContextTypeConvert = (rawValue) => {
    return asPrettyString(rawValue);
  };
}
