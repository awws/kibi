var expect = require('expect.js');
var ngMock = require('ngMock');
var dashboardHelper;

var mockSavedObjects = require('fixtures/kibi/mock_saved_objects');
var fakeSavedDashboards = [
  {
    id: 'ds1',
    savedSearchId: 'timebasedSavedSearch'
  },
  {
    id: 'ds2',
    savedSearchId: 'notTimebasedSavedSearch'
  },
  {
    id: 'ds3'
  }
];

var fakeSavedSearches = [
  {
    id: 'timebasedSavedSearch',
    searchSource: {
      index: function () {
        return {
          hasTimeField: function () {
            return true;
          }
        };
      }
    }
  },
  {
    id: 'notTimebasedSavedSearch',
    searchSource: {
      index: function () {
        return {
          hasTimeField: function () {
            return false;
          }
        };
      }
    }
  }
];

describe('Kibi Components', function () {
  describe('Dashboard Helper', function () {

    require('testUtils/noDigestPromises').activateForSuite();

    beforeEach(function () {

      ngMock.module('kibana', function ($provide) {
        $provide.constant('kbnDefaultAppId', 'dashboard');
        $provide.constant('kibiDefaultDashboardId', '');
        $provide.constant('kibiEnterpriseEnabled', false);
        $provide.constant('elasticsearchPlugins', ['siren-join']);
        $provide.service('savedDashboards', (Promise) => mockSavedObjects(Promise)('savedDashboards', fakeSavedDashboards));
        $provide.service('savedSearches', (Promise) => mockSavedObjects(Promise)('savedSearches', fakeSavedSearches));
      });

      ngMock.inject(function ($injector, Private, _$rootScope_) {
        dashboardHelper = Private(require('ui/kibi/helpers/dashboard_helper'));
      });
    });

    it('getTimeDependentDashboards should return only 1', function (done) {
      var expectedDashboards = [
        {
          id: 'ds1',
          savedSearchId: 'timebasedSavedSearch'
        }
      ];

      dashboardHelper.getTimeDependentDashboards().then(function (dashboards) {
        expect(dashboards).to.eql(expectedDashboards);
        done();
      }).catch(done);

    });

  });
});
