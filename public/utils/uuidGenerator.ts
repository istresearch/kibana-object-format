import { v4 } from 'uuid';

export const generateUuids = (count = 1) => {
  const uuids: any = [];
  for (let i = 0; i < count; i++) {
    uuids.push(v4());
  }
  return uuids;
};
