import { ObjectFieldFormatStub } from './ObjectFieldFormatStub';

export function registerFieldFormats(server) {
  server.registerFieldFormat(ObjectFieldFormatStub);
}
