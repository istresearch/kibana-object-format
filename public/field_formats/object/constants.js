export const ID = 'ist-object';
export const TITLE = 'Object';
export const FIELD_TYPE = [
    'string',
    'unknown'
];

export const DEFAULT_VALUES = {
    label: null, // Optional data label
    path: null, // Dot notated location of the value within the object, relative to basePath
    type: 'text',
    filtered: true, // To enable the filtering on cell click
    filterField: null, // If the data is analyzed, and there is a keyword subfield we can use for the filter
    height: null, // Image dimension in px
    width: null, // Image dimension in px
    limit: null // If presenting an array, this is the max we will show
};

export const FORMAT_TYPES = [
    { id: 'text', name: 'Text' },
    { id: 'link', name: 'Link' },
    { id: 'image', name: 'Image' }
];