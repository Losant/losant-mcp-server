import { NESTED_RESOURCES, RESOURCE_TYPE_TO_GUIDE } from '../../../constants.js';

// The `parentResourceId` column shared by every resource-table tool guide (query/write/delete):
// the field whose value goes in the `parentResourceId` parameter, or `—` if the type is not nested.
export const parentResourceIdColumn = (type) => {
  const nested = NESTED_RESOURCES[type];
  return nested ? `\`${nested.parentField}\`` : '—';
};

// The `Domain Guide` column shared by every resource-table tool guide.
export const domainGuideColumn = (type) => RESOURCE_TYPE_TO_GUIDE[type] || '—';

// Builds the "Nested types — how to obtain the parentResourceId" bullet list from NESTED_RESOURCES.
// Wording and inclusion differ per tool, so both are passed in: `formatNote` renders one bullet,
// `filterType` (optional) restricts which types get a bullet at all (e.g. delete only lists
// deletable types that need an explicit note).
export const buildNestedNote = (formatNote, filterType = () => true) => Object.entries(NESTED_RESOURCES)
  .filter(([type]) => filterType(type))
  .map(([type, { parentField, parentType }]) => formatNote(type, parentField, parentType))
  .join('\n');
