import React, { Fragment } from 'react';
import {
  EuiBasicTable,
  EuiButton,
  EuiSpacer,
  EuiFieldText,
  EuiTextArea,
  EuiFormRow,
  EuiFieldNumber,
  EuiSelect,
  EuiCheckbox,
} from '@elastic/eui';
import { DefaultFormatEditor } from '../../../../../src/legacy/ui/public/field_editor/components/field_format_editor/editors/default';
import { ID, DEFAULT_VALUES, FORMAT_TYPES } from './constants';

export class ObjectFormatEditor extends DefaultFormatEditor {
  static formatId = ID;

  constructor(props) {
    super(props);
    this.onChange({
      fieldType: props.fieldType,
    });
  }

  onFieldChange = (newFieldParams, index) => {
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
    const fields = [...this.props.formatParams.fields];
    this.onChange({
      fields: [...fields, { ...DEFAULT_VALUES }],
    });
  };

  removeField = index => {
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
        render: (value, item) => {
          return (
            <EuiSelect
              value={value}
              options={FORMAT_TYPES.map(type => {
                return {
                  value: type.id,
                  text: type.name,
                };
              })}
              onChange={e => {
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
        render: (value, item) => {
          return (
            <EuiFieldText
              value={value}
              onChange={e => {
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
        render: (value, item) => {
          return (
            <EuiFieldText
              value={value}
              onChange={e => {
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
        render: (value, item) => {
          return (
            <EuiFieldText
              value={value}
              onChange={e => {
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
        render: (value, item) => {
          return (
            <EuiFieldText
              value={value}
              onChange={e => {
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
        render: (value, item) => {
          return (
            <EuiFieldNumber
              value={value}
              onChange={e => {
                this.onFieldChange(
                  {
                    limit: e.target.value ? Number(e.target.value) : null,
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
        render: (value, item) => {
          return (
            <EuiCheckbox
              checked={value}
              onChange={e => {
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
        render: (value, item) => {
          return item.type === 'image' ? (
            <EuiFieldNumber
              value={value}
              onChange={e => {
                this.onFieldChange(
                  {
                    width: e.target.value ? Number(e.target.value) : null,
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
        render: (value, item) => {
          return item.type === 'image' ? (
            <EuiFieldNumber
              value={value}
              onChange={e => {
                this.onFieldChange(
                  {
                    height: e.target.value ? Number(e.target.value) : null,
                  },
                  item.index
                );
              }}
            />
          ) : null;
        },
      },
      {
        width: '40px',
        actions: [
          {
            name: 'Delete',
            description: 'Delete Field',
            onClick: item => {
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
            onChange={e => {
              this.onChange({ basePath: e.target.value });
            }}
          />
        </EuiFormRow>
        <EuiFormRow label="Array Limit" helpText="(optional)">
          <EuiFieldNumber
            value={formatParams.limit}
            onChange={e => {
              this.onChange({ limit: e.target.value ? Number(e.target.value) : null });
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
            onChange={e => {
              this.onChange({ similarityScript: e.target.value });
            }}
          />
        </EuiFormRow>
        <EuiSpacer size="l" />
      </Fragment>
    );
  }
}
