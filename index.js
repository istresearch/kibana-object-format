
export default function (kibana) {
  return new kibana.Plugin({
    require: ['elasticsearch', 'kibana'],

    uiExports: {
      hacks: [
        'plugins/test_plugin/hacks/field_mapping_hack'
      ]
    }
  });
};
