import { resolve } from 'path';

export default function (kibana) {
  return new kibana.Plugin({
    require: ['elasticsearch'],

    uiExports: {
      hacks: [
        'plugins/test_plugin/hacks/field_mapping_hack'
      ]
    },
    config(Joi) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
      }).default();
    }
  });
};
