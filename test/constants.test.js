import './common.js';
import { RESOURCE_TYPES, NESTED_RESOURCES, APPLICATION_RESOURCES } from '../src/constants.js';

describe('Constants', () => {
  describe('RESOURCE_TYPES', () => {
    it('should be an array', () => {
      RESOURCE_TYPES.should.be.an.Array();
    });

    it('should have correct resource types array and ensure none end in s', () => {
      RESOURCE_TYPES.should.containEql('application');
      RESOURCE_TYPES.should.containEql('device');
      RESOURCE_TYPES.should.containEql('flow');
      RESOURCE_TYPES.should.containEql('dataTable');
      RESOURCE_TYPES.should.containEql('webhook');
      RESOURCE_TYPES.should.containEql('applicationDashboard');
      RESOURCE_TYPES.should.containEql('integration');
      RESOURCE_TYPES.should.containEql('credential');
      RESOURCE_TYPES.should.containEql('file');
      RESOURCE_TYPES.should.containEql('experienceDomain');
      RESOURCE_TYPES.should.containEql('experienceEndpoint');
      RESOURCE_TYPES.should.containEql('experienceGroup');
      RESOURCE_TYPES.should.containEql('experienceUser');
      RESOURCE_TYPES.should.containEql('experienceVersion');
      RESOURCE_TYPES.should.containEql('experienceView');
      RESOURCE_TYPES.forEach((type) => {
        type.should.not.match(/s$/);
      });
    });

    it('should include nested resources', () => {
      RESOURCE_TYPES.should.containEql('flowVersion');
      RESOURCE_TYPES.should.containEql('dataTableRow');
    });

    it('should have at least 20 resource types', () => {
      RESOURCE_TYPES.length.should.be.above(20);
    });

    it('should not have duplicates', () => {
      const uniqueTypes = [...new Set(RESOURCE_TYPES)];
      uniqueTypes.length.should.equal(RESOURCE_TYPES.length);
    });
  });

  describe('NESTED_RESOURCES', () => {
    it('should be an object', () => {
      NESTED_RESOURCES.should.be.an.Object();
    });

    it('should only contain expected nested resources', () => {
      const keys = Object.keys(NESTED_RESOURCES);
      keys.should.have.length(2);
      keys.should.containEql('flowVersion');
      keys.should.containEql('dataTableRow');
    });

    it('should have parent field names ending in Id', () => {
      Object.values(NESTED_RESOURCES).forEach(({ parentField, parentType }) => {
        parentField.should.match(/Id$/);
        parentType.should.be.a.String();
      });
    });
  });

  describe('APPLICATION_RESOURCES', () => {
    it('should be an array', () => {
      APPLICATION_RESOURCES.should.be.an.Array();
    });

    it('should exclude "application" from APPLICATION_RESOURCES', () => {
      APPLICATION_RESOURCES.should.not.containEql('application');
    });

    it('should include all other resources in APPLICATION_RESOURCES', () => {
      APPLICATION_RESOURCES.should.containEql('device');
      APPLICATION_RESOURCES.should.containEql('flow');
      APPLICATION_RESOURCES.should.containEql('dataTable');
      APPLICATION_RESOURCES.should.containEql('webhook');
      APPLICATION_RESOURCES.should.containEql('applicationDashboard');
      APPLICATION_RESOURCES.should.containEql('flowVersion');
      APPLICATION_RESOURCES.should.containEql('dataTableRow');
    });

    it('should have exactly one less item than RESOURCE_TYPES', () => {
      APPLICATION_RESOURCES.length.should.equal(RESOURCE_TYPES.length - 1);
    });

    it('should be a subset of RESOURCE_TYPES', () => {
      APPLICATION_RESOURCES.forEach((resource) => {
        RESOURCE_TYPES.should.containEql(resource);
      });
    });

    it('should not have duplicates', () => {
      const uniqueResources = [...new Set(APPLICATION_RESOURCES)];
      uniqueResources.length.should.equal(APPLICATION_RESOURCES.length);
    });
  });
});
