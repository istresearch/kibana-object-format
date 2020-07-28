import { npSetup } from 'ui/new_platform';
import { ObjectFormat } from './object';
npSetup.plugins.data.fieldFormats.register([ObjectFormat]);

import { RegistryFieldFormatEditorsProvider } from 'ui/registry/field_format_editors';
import { ObjectFormatEditor } from './editor';
RegistryFieldFormatEditorsProvider.register(() => ObjectFormatEditor);
