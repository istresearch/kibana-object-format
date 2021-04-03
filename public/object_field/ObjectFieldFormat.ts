import { get, isObject, escape, isArray, compact, slice, template, TemplateExecutor } from 'lodash';
import {
  HtmlContextTypeConvert,
  TextContextTypeConvert,
} from '../../../../src/plugins/data/common/field_formats/types';
import { FieldFormat } from '../../../../src/plugins/data/public';
import { getFullPath, getPluck, asPrettyString, getHighlightHtml, generateUuids } from '../utils';
import formatHTML from './templates/object_format.html';
import imageHTML from './templates/object_image.html';
import linkHTML from './templates/object_link.html';
import textHTML from './templates/object_text.html';
import emptyHTML from './templates/object_empty.html';
import { ObjectFieldParams, ObjectField, ObjectFieldType } from '../types';

const DEFAULT_VALUES: ObjectField = {
  label: undefined, // Optional data label
  path: undefined, // Dot notated location of the value within the object, relative to basePath
  type: ObjectFieldType.TEXT,
  filtered: true, // To enable the filtering on cell click
  dHashField: undefined,
  filterField: undefined, // If the data is analyzed, and there is a keyword subfield we can use for the filter
  height: undefined, // Image dimension in px
  width: undefined, // Image dimension in px
  limit: undefined, // If presenting an array, this is the max we will show
};

export class ObjectFieldFormat extends FieldFormat {
  static id = 'ist-object';
  static title = 'Object';
  static fieldType = ['string'];

  getParamDefaults(): ObjectFieldParams {
    return {
      fieldType: undefined, // populated by editor, see controller
      basePath: undefined, // If multiple fields should be grouped, this is the common parent
      limit: undefined, // // If basePath is an array, this is the max we will show
      similarityScript: undefined,
      fields: [{ ...DEFAULT_VALUES }],
    };
  }

  private fieldToHtml(field: Partial<ObjectField> & { values: any }): string {
    let tmplhtml: TemplateExecutor;

    switch (field.type) {
      case ObjectFieldType.IMAGE:
        tmplhtml = template(imageHTML);
        break;
      case ObjectFieldType.LINK:
        tmplhtml = template(linkHTML);
        break;
      case ObjectFieldType.TEXT:
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
    hit?: Record<string, any>;
    basePath?: string;
    objectFields: ObjectField[];
  }) {
    let filtered = false;
    const fields = [];

    console.log(objectFields);
    for (let objectField of objectFields) {
      console.log(objectField);
      const {
        path = '',
        label,
        limit,
        type,
        filterField,
        filtered: filtered2,
        width,
        height,
      } = objectField;

      if (filtered2) {
        filtered = filtered2;
      }

      let fieldValues = getPluck(value, path);

      if (type === ObjectFieldType.TEXT) {
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
      getHighlightHtml;
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

        if (hit?.highlight && hit.highlight[fullPath]) {
          valueModel.display = getHighlightHtml(valueModel.display, hit.highlight[fullPath]);
        } else if (hit?.highlight && hit.highlight[filterPath]) {
          valueModel.display = getHighlightHtml(valueModel.display, hit.highlight[filterPath]);
        }

        valueModels.push(valueModel);
      }

      const html = this.fieldToHtml({
        label: label ? `${label}:` : '',
        type,
        values: valueModels,
        width,
        height,
        filterField,
      });

      fields.push({
        formatType: type,
        label: label ? `${label}:` : '',
        html,
      });

      
    }
    return { filtered: filtered, fields: fields };
  }

  htmlConvert: HtmlContextTypeConvert = (rawValue: string | string[], options = {}) => {
    const { field, hit } = options;
    const visTemplate = template(formatHTML);
    const emptyTemplate = template(emptyHTML);
    const basePath = <string | undefined>this.param('basePath');
    const objectFields = <ObjectField[]>this.param('fields');
    const limit = <number | undefined>this.param('limit');

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
              uid: generateUuids()[0],
            })
          );
        }
      }

      return htmlSnippets.join('\n');
    } else {
      return emptyTemplate();
    }
  };

  textConvert: TextContextTypeConvert = (rawValue) => {
    return asPrettyString(rawValue);
  };
}
