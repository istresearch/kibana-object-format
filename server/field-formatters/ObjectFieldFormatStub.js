import { FieldFormat } from '../../../../src/plugins/data/common/field_formats/field_format';

export class ObjectFieldFormatStub extends FieldFormat {
  constructor(params) {
    super(params);
  }

  static id = 'ist-object';
  static title = 'Object';

  getParamDefaults() {
    return {};
  }
}
 