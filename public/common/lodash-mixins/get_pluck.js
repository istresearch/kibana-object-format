export function lodashGetPluckMixin(_) {

    const toPath = require('lodash/internal/toPath');
    const toObject = require('lodash/internal/toObject');

    /**
    * The base implementation of `get` without support for string paths
    * and default values.
    *
    * @private
    * @param {Object} object The object to query.
    * @param {Array} path The path of the property to get.
    * @param {string} [pathKey] The key representation of path.
    * @returns {*} Returns the resolved value.
    */
    function baseGetWithPluck(object, path, pathKey) {

        if (object == null) {
            return;
        }

        if (pathKey !== undefined && pathKey in toObject(object)) {
            path = [pathKey];
        }

        let index = 0;
        const length = path.length;

        while (object != null && index < length) {
            const key = path[index++];

            if (_.isArray(object) && !_.has(object, key)) {
                object = _.map(object, _.property(_.slice(path, index - 1)));
                index = length;
            }
            else {
                object = object[key];
            }
        }

        return (index && index === length) ? object : undefined;
    }

    _.mixin(_, {
        /**
         * Gets the property value at `path` of `object`. If the resolved value is
         * `undefined` the `defaultValue` is used in its place. This uses the
         * `pluck` method to support returning a set of results if an array is
         * encountered mid-path.
         *
         * @static
         * @memberOf _
         * @category Object
         * @param {Object} object The object to query.
         * @param {Array|string} path The path of the property to get.
         * @param {*} [defaultValue] The value returned if the resolved value is `undefined`.
         * @returns {*} Returns the resolved value.
         * @example
         *
         * var object = { 'a': [{ 'b': { 'c': 3 } },{ 'b': { 'c': 7 } }] };
         *
         * _.get(object, 'a[0].b.c');
         * // => 3
         *
         * _.get(object, 'a[*].b.c');
         * // => [3, 7]
         *
         * _.get(object, ['a', '0', 'b', 'c']);
         * // => 3
         *
         * _.get(object, 'a.b.c', 'default');
         * // => 'default'
         */
        getPluck: function (object, path, defaultValue) {
            const result = object == null ? undefined : baseGetWithPluck(object, toPath(path), path + '');
            return result === undefined ? defaultValue : result;
        }
    });
}
