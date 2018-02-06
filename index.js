
export default function (kibana) {
    return new kibana.Plugin({

        require: ['kibana'],

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
                    description: 'Configure field formatters for objects and arrays of objects by declaring the patterns and fields. See the <a href="https://github.com/istresearch/kibana-object-format" target="_blank">kibana-object-formatter</a> plugin project.'
                }
            }
        }
    });
};
