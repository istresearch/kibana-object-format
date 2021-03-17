import { has, uniq, difference } from 'lodash';
import { IUiSettingsClient } from 'kibana/public';
import { FieldSpec, IndexPatternSpec } from 'src/plugins/data/common';

export interface IFieldMapper {
  uiSettings: IUiSettingsClient;
  fields: FieldSpec[];
  indexPattern: IndexPatternSpec;
}

export const fieldMapper = ({ uiSettings, fields, indexPattern }: IFieldMapper): FieldSpec[] => {
  const { index_pattern: settings } = uiSettings.get('ObjectFieldMapper:fields');

  if (!indexPattern?.id) {
    throw Error('fieldMapper: IndexPattern.id is missing.');
  }

  let match = { include: [], exclude: [] };
  if (has(settings, '*')) {
    match = settings['*'];
  } else if (has(settings, indexPattern.id)) {
    match = settings[indexPattern.id];
  }

  // 1) Iterate the field names, identify the "parent" paths
  const mappingNames: string[] = [];
  let paths: string[] = [];
  

  for (let field of fields) {
    const fieldName = field.name;
    const parts = fieldName.split('.');

    mappingNames.push(fieldName);

    while (parts.length > 1) {
      parts.pop();
      paths.push(parts.join('.'));
    }
  }

  paths = uniq(difference(paths, mappingNames));

  // 2) Test the discovered field names against the configuration
  const included: string[] = [];
  const excluded: string[] = [];

  for (let expression of match.include) {
    for (let path of paths) {
      if (path.match(expression)) {
        included.push(path);
      }
    }
  }

  for (let expression of match.exclude) {
    for (let path of paths) {
      if (path.match(expression)) {
        excluded.push(path);
      }
    }
  }

  // 3) Add a field mapping for the missing parents
  for (let path of difference(included, excluded)) {
    fields.push({
      name: path,
      aggregatable: false,
      searchable: true,
      indexed: true,
      type: 'string',
    });
  }

  return fields;
};
