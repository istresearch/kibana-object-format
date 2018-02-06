
export default function (kibana) {
    return new kibana.Plugin({

        require: ['elasticsearch', 'kibana'],

        uiExports: {
            visTypes: [
                'plugins/kibana_object_format/stringify/object'
            ],
            hacks: [
                'plugins/kibana_object_format/hacks/field_mapper_hack',
                'plugins/kibana_object_format/hacks/object_filtering_hack'
            ],
            uiSettingDefaults: {
                'fieldMapperHack:fields': {
                    value: '{\n  "index_pattern": {\n    "*": {\n      "include": [],\n      "exclude": [".*"]\n    }\n  }\n}',
                    type: 'json',
                    description: 'Define the index patterns and fields to allow you to configure field formatters for arrays of objects. See the <a href="https://github.com/istresearch/kibana-object-format" target="_blank">kibana-object-formatter</a> plugin project.'
                }
            }
        }
    });
};
