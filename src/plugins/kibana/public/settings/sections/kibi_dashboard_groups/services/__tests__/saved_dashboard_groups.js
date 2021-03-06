var expect = require('expect.js');
var ngMock = require('ngMock');
var Promise = require('bluebird');
var sinon = require('auto-release-sinon');

var savedDashboardGroups;

describe('Kibi Services', function () {
  describe('savedDashboardGroups', function () {

    require('testUtils/noDigestPromises').activateForSuite();

    beforeEach(function () {

      ngMock.module('kibana');

      ngMock.inject(function ($injector, Private, _$rootScope_) {
        savedDashboardGroups = $injector.get('savedDashboardGroups');
        var mappingSetup = Private(require('ui/utils/mapping_setup'));
        // here we to stub a function from mappingSetup to avoid the call to private method
        // which requires access to elasticsearch
        sinon.stub(mappingSetup, 'isDefined').returns(Promise.resolve(true));
      });
    });

    it('object should not be cached when id undefined or missing', function (done) {
      savedDashboardGroups.get().then(function (firstSavedDashboardGroup) {
        return savedDashboardGroups.get().then(function (secondSavedDashboardGroup) {
          expect(firstSavedDashboardGroup !== secondSavedDashboardGroup).to.equal(true);
          done();
        });
      }).catch(done);
    });

  });
});
