
module.exports = function defaultSettings() {

    const prefix = "fieldMapperHack"

    let config = {}

    config[[prefix, 'fields'].join(':')] = {
         value: {
             index_pattern: {
                 "*": {
                     include: [],
                     exclude: [".*"]
                 }
             }
         },
         type: 'json',
         description: "Kibana won't let us define this from a plugin, yet. See https://github.com/elastic/kibana/issues/10863"
    }

    return config
}
