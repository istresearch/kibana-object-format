
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
            ]
        }
    });
};
