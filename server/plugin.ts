import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from '../../../src/core/server';
import { schema } from '@kbn/config-schema';
import { KibanaObjectFormatPluginSetup, KibanaObjectFormatPluginStart } from './types';
import { defineRoutes } from './routes';

const FIELD_MAPPER_HACK_DEFAULT = `
  {
    "index_pattern": { 
      "*": { 
        "include": [], 
        "exclude": [".*"] 
      } 
    }
  }
`;

export class KibanaObjectFormatPlugin
  implements Plugin<KibanaObjectFormatPluginSetup, KibanaObjectFormatPluginStart> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup) {
    this.logger.debug('kibana_object_format: Setup');
    const router = core.http.createRouter();
    core.uiSettings.register({
      'ObjectFieldMapper:fields': {
        name: 'Object Field Mapper',
        value: FIELD_MAPPER_HACK_DEFAULT,
        schema: schema.object({
          index_pattern: schema.object({
            '*': schema.object({
              include: schema.arrayOf(schema.string()),
              exclude: schema.arrayOf(schema.string()),
            })
          }),
        }),
        type: 'json',
        description: 'Configure field formatters for objects and arrays of objects by declaring the patterns and fields. See the <a href="https://github.com/istresearch/kibana-object-format" target="_blank">kibana-object-formatter</a> plugin project.',
      },
    });
    
    // Register server side APIs
    defineRoutes(router);

    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug('kibana_object_format: Started');
    return {};
  }

  public stop() { }
}
