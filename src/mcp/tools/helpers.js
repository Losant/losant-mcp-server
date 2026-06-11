export const getResourceFieldId = (resourceType) => {
  if (resourceType === 'dataTableRow') { return 'rowId'; }
  if (resourceType === 'experienceVersion') { return 'experienceVersionIdOrName'; }
  if (resourceType === 'applicationDashboard') { return 'dashboardId'; }
  return `${resourceType}Id`;
};
