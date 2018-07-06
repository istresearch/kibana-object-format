import { fieldFormats } from 'ui/registry/field_formats';
import { createObjectFormat } from './object';
fieldFormats.register(createObjectFormat);

import { RegistryFieldFormatEditorsProvider } from 'ui/registry/field_format_editors';
import { objectEditor } from './object';
RegistryFieldFormatEditorsProvider.register(objectEditor);