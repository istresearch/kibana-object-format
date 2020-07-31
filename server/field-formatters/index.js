import { ObjectFieldFormatStub } from './ObjectFieldFormatStub';

export function registerFieldFormats(server) {
  server.newPlatform.setup.plugins.data.fieldFormats.register(ObjectFieldFormatStub);
}
