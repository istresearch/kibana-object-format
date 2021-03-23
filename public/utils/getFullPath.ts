export const getFullPath = ({
  basePath,
  field,
  path,
  filterField,
}: {
  field: { name: string };
  path: string;
  basePath?: string;
  filterField?: string;
}) => {
  const parts = [field.name];

  if (basePath) {
    parts.push(basePath);
  }

  parts.push(path);

  if (filterField) {
    parts.push(filterField);
  }

  return parts.join('.');
};
