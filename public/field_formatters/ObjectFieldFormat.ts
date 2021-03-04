import { FieldFormat } from '../../../../src/plugins/data/public';

export class ObjectFieldFormat extends FieldFormat {
  static id = 'ist-object';
  static title = 'Object';
  static fieldType = ['string'];


  getParamDefaults() {
    return {};
  }

}