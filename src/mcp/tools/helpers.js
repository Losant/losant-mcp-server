export const getResourceFieldId = (resourceType) => {
  if (resourceType === 'dataTableRow') { return 'rowId'; }
  if (resourceType === 'experienceVersion') { return 'experienceVersionIdOrName'; }
  if (resourceType === 'applicationDashboard') { return 'dashboardId'; }
  if (resourceType === 'applicationJobLog') { return 'jobId'; }
  // Default to resourceType + 'Id', e.g. deviceId, flowId, etc.
  return `${resourceType}Id`;
};
