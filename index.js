
export default function (kibana) {
    return new kibana.Plugin({

        require: ['elasticsearch', 'kibana'],

        uiExports: {
            visTypes: [
                'plugins/kibana_object_viz/stringify/object'
            ],
            hacks: [
                'plugins/kibana_object_viz/hacks/field_mapper_hack',
                'plugins/kibana_object_viz/hacks/object_filtering_hack'
            ]
        }
    });
};
