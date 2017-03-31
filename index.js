
export default function (kibana) {
    return new kibana.Plugin({

        require: ['elasticsearch', 'kibana'],

        uiExports: {
            visTypes: [
                'plugins/field_mapper_hack/stringify/object'
            ],
            hacks: [
                'plugins/field_mapper_hack/hacks/field_mapper_hack'
            ]
        }
    });
};
