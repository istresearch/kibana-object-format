import React, { Fragment } from 'react';
import {
  EuiBasicTable,
  EuiSpacer,
  EuiFieldText,
  EuiButton,
  EuiTextArea,
  EuiFormRow,
  EuiFieldNumber,
  EuiSelect,
  EuiCheckbox,
} from '@elastic/eui';
import { FieldFormat } from '../../../../src/plugins/data/public';
import { DefaultFormatEditor } from '../../../../src/plugins/index_pattern_management/public'; 

/* TO-DO: Elastic Teams needs to expose FormatEditorProps to the public. Embedding here for now. */
interface FormatEditorProps<P> {
  fieldType: string;
  format: FieldFormat;
  formatParams: { type?: string } & P;
  onChange: (newParams: Record<string, any>) => void;
  onError: any;
}

interface ObjectField {
  type?: string;
  label?: string;
  path?: string;
  dHashField?: string;
  filterField?: string;
  limit?: number;
  filtered?: boolean;
  width?: number;
  height?: number;
}

interface IndexedObjectField extends ObjectField {
  index: number;
}

interface ObjectFieldEditorFormatParams {
  fields: ObjectField[];
  basePath?: string;
  limit?: number;
  similarityScript?: string;
}

interface FormatValue {
  id: string;
  name: string;
}

const DEFAULT_VALUES: ObjectField = {
  type: 'text',
  label: undefined, // Optional data label
  path: undefined, // Dot notated location of the value within the object, relative to basePath
  filtered: true, // To enable the filtering on cell click
  dHashField: undefined,
  filterField: undefined, // If the data is analyzed, and there is a keyword subfield we can use for the filter
  height: undefined, // Image dimension in px
  width: undefined, // Image dimension in px
  limit: undefined // If presenting an array, this is the max we will show
};

export const FORMAT_TYPES: FormatValue[] = [
  { id: 'text', name: 'Text' },
  { id: 'link', name: 'Link' },
  { id: 'image', name: 'Image' }
];

export class ObjectFieldFormatEditor extends DefaultFormatEditor<ObjectFieldEditorFormatParams> {
  static formatId = 'ist-object';

  constructor(props: FormatEditorProps<ObjectFieldEditorFormatParams>) {
    super(props);
    this.onChange({
      fieldType: props.fieldType,
    });
  }

  onFieldChange = (newFieldParams: Partial<ObjectField>, index: number) => {
    const fields = [...this.props.formatParams.fields];
    fields[index] = {
      ...fields[index],
      ...newFieldParams,
    };
    this.onChange({
      fields,
    });
  };

  addField = () => {
    const fields = [...(this.props.formatParams.fields || [])];
    this.onChange({
      fields: [...fields, { ...DEFAULT_VALUES }],
    });
  };

  removeField = (index: number) => {
    const fields = [...this.props.formatParams.fields];
    fields.splice(index, 1);
    this.onChange({
      fields,
    });
  };

  render() {
    const { formatParams } = this.props;

    const items =
      (formatParams.fields &&
        formatParams.fields.length &&
        formatParams.fields.map((field, index) => {
          return {
            ...field,
            index,
          };
        })) ||
      [];

    const columns = [
      {
        field: 'type',
        name: 'Format',
        render: (value: string, item: IndexedObjectField) => {
          return (
            <EuiSelect
              value={value}
              options={FORMAT_TYPES.map((type) => {
                return {
                  value: type.id,
                  text: type.name,
                };
              })}
              onChange={(e) => {
                this.onFieldChange(
                  {
                    type: e.target.value,
                  },
                  item.index
                );
              }}
            />
          );
        },
      },
      {
        field: 'label',
        name: 'Label',
        render: (value: string, item: IndexedObjectField) => {
          return (
            <EuiFieldText
              value={value}
              onChange={(e) => {
                this.onFieldChange(
                  {
                    label: e.target.value,
                  },
                  item.index
                );
              }}
            />
          );
        },
      },
      {
        field: 'path',
        name: 'Field',
        render: (value: string, item: IndexedObjectField) => {
          return (
            <EuiFieldText
              value={value}
              onChange={(e) => {
                this.onFieldChange(
                  {
                    path: e.target.value,
                  },
                  item.index
                );
              }}
            />
          );
        },
      },
      {
        field: 'dHashField',
        name: 'Hash Field',
        render: (value: string, item: IndexedObjectField) => {
          return (
            <EuiFieldText
              value={value}
              onChange={(e) => {
                this.onFieldChange(
                  {
                    dHashField: e.target.value,
                  },
                  item.index
                );
              }}
            />
          );
        },
      },
      {
        field: 'filterField',
        name: 'Filter Field',
        render: (value: string, item: IndexedObjectField) => {
          return (
            <EuiFieldText
              value={value}
              onChange={(e) => {
                this.onFieldChange(
                  {
                    filterField: e.target.value,
                  },
                  item.index
                );
              }}
            />
          );
        },
      },
      {
        field: 'limit',
        name: 'Array Limit',
        width: '100px',
        render: (value: number, item: IndexedObjectField) => {
          return (
            <EuiFieldNumber
              value={value}
              onChange={(e) => {
                this.onFieldChange(
                  {
                    limit: e.target.value ? Number(e.target.value) : undefined,
                  },
                  item.index
                );
              }}
            />
          );
        },
      },
      {
        field: 'filtered',
        name: 'Filter',
        width: '60px',
        render: (value: boolean, item: IndexedObjectField) => {
          return (
            <EuiCheckbox
              id=""
              checked={value}
              onChange={(e) => {
                this.onFieldChange(
                  {
                    filtered: e.target.checked,
                  },
                  item.index
                );
              }}
            />
          );
        },
      },
      {
        field: 'width',
        name: 'Width',
        width: '80px',
        render: (value: number, item: IndexedObjectField) => {
          return item.type === 'image' ? (
            <EuiFieldNumber
              value={value}
              onChange={(e) => {
                this.onFieldChange(
                  {
                    width: e.target.value ? Number(e.target.value) : undefined,
                  },
                  item.index
                );
              }}
            />
          ) : null;
        },
      },
      {
        field: 'height',
        name: 'Height',
        width: '80px',
        render: (value: number, item: IndexedObjectField) => {
          return item.type === 'image' ? (
            <EuiFieldNumber
              value={value}
              onChange={(e) => {
                this.onFieldChange(
                  {
                    height: e.target.value ? Number(e.target.value) : undefined,
                  },
                  item.index
                );
              }}
            />
          ) : null;
        },
      },
      {
        field: 'actions',
        name: '',
        width: '40px',
        actions: [
          {
            name: 'Delete',
            description: 'Delete Field',
            onClick: (item: IndexedObjectField) => {
              this.removeField(item.index);
            },
            type: 'icon',
            icon: 'trash',
            color: 'danger',
            available: () => items.length > 1,
          },
        ],
      },
    ];

    return (
      <Fragment>
        <EuiFormRow label="Base Path" helpText="(optional, dot notation)">
          <EuiFieldText
            value={formatParams.basePath}
            onChange={(e) => {
              this.onChange({ basePath: e.target.value });
            }}
          />
        </EuiFormRow>
        <EuiFormRow label="Array Limit" helpText="(optional)">
          <EuiFieldNumber
            value={formatParams.limit}
            onChange={(e) => {
              this.onChange({ limit: e.target.value ? Number(e.target.value) : undefined });
            }}
          />
        </EuiFormRow>
        <EuiSpacer size="l" />
        <EuiBasicTable items={items} columns={columns} noItemsMessage="No Fields found" />
        <EuiSpacer size="m" />
        <EuiButton iconType="plusInCircle" size="s" onClick={this.addField}>
          Add Field
        </EuiButton>
        <EuiSpacer size="l" />
        <EuiFormRow label="Image Similarity Script (Painless)" helpText="(optional)">
          <EuiTextArea
            fullWidth
            value={formatParams.similarityScript}
            onChange={(e) => {
              this.onChange({ similarityScript: e.target.value });
            }}
          />
        </EuiFormRow>
        <EuiSpacer size="l" />
      </Fragment>
    );
  }
}
