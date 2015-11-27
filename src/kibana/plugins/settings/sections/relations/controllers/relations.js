define(function (require) {

  require('eeg');
  require('css!plugins/settings/sections/relations/styles/relations.css');

  var $ = require('jquery');
  var _ = require('lodash');

  var app = require('modules').get('apps/settings', ['kibana']);

  require('routes')
  .when('/settings/relations', {
    template: require('text!plugins/settings/sections/relations/index.html'),
    reloadOnSearch: false
  });

  app.controller('RelationsController', function ($scope, AppState, config, Notifier, Private) {
    var urlHelper = Private(require('components/kibi/url_helper/url_helper'));
    var notify = new Notifier({ location: 'Kibi Relations'});
    var $state = $scope.state = new AppState();

    $scope.relations = config.get('kibi:relations');
    $scope.relationalPanel = config.get('kibi:relationalPanel');

    $scope.changeTab = function (tab) {
      $state.tab = tab;
      $state.save();
    };
    $scope.changeTab('indices');

    $scope.$watch('relationalPanel', function () {
      config.set('kibi:relationalPanel', $scope.relationalPanel);
    });

    var indexToDashboardsMap = null;

    /**
     * Filters out the dashboards that are not relevant in the row with the given id
     */
    $scope.filterDashboards = function (id, value) {
      var relDash = $scope.relations.relationsDashboards[id];

      if (!value) {
        // this is the watched value
        return relDash;
      }
      if (!!value) {
        var remove = true;

        // do not remove if the dashboard is associated with an index
        if (!!indexToDashboardsMap) {
          _.each(indexToDashboardsMap, function (dashboards) {
            if (dashboards.indexOf(value) !== -1) {
              remove = false;
              return false;
            }
          });
        }

        // remove if the dashboard is not in the list of dashboards that are directly connected to value
        var connectedDashboards = [];
        if (!!relDash.dashboards[0] && !relDash.dashboards[1]) {
          connectedDashboards = _getConnectedDashboards(relDash.dashboards[0], relDash.relation);
        } else if (!!relDash.dashboards[1] && !relDash.dashboards[0]) {
          connectedDashboards = _getConnectedDashboards(relDash.dashboards[1], relDash.relation);
        } else if (!relDash.dashboards[0] && !relDash.dashboards[1] && !!relDash.relation) {
          // filter based on the selected relation
          connectedDashboards = _getConnectedDashboards(null, relDash.relation);
        }
        if (connectedDashboards.length && connectedDashboards.indexOf(value) === -1) {
          remove = true;
        }

        if (!!relDash.dashboards[0] && !!relDash.dashboards[1] && !!relDash.relation) {
          remove = true;
        }
        return remove;
      }
      return false;
    };

    /**
     * Returns the index associated with dashboardId
     */
    function _getIndexForDashboard(dashboardId) {
      var dIndex = '';

      if (!dashboardId) {
        return '';
      }
      _.each(indexToDashboardsMap, function (map, index) {
        if (map.indexOf(dashboardId) !== -1) {
          dIndex = index;
          return false;
        }
      });
      return dIndex;
    }

    /**
     * Returns the list of dashboards that are directly connected to dashboardId
     */
    function _getConnectedDashboards(dashboardId, relDash) {
      var index = _getIndexForDashboard(dashboardId);

      return _($scope.relations.relationsIndices).map(function (relInd) {
        if (!relDash || relDash === relInd.id) {
          var dashboards = [];

          if ((!!relDash && !index) || index === relInd.indices[0].indexPatternId) {
            dashboards = dashboards.concat(indexToDashboardsMap[relInd.indices[1].indexPatternId]);
          }
          if ((!!relDash && !index) || index === relInd.indices[1].indexPatternId) {
            dashboards = dashboards.concat(indexToDashboardsMap[relInd.indices[0].indexPatternId]);
          }
          return dashboards;
        }
      }).flatten().compact().uniq().value();
    }

    /**
     * Filters out the relations that are not relevant in the row with the given id
     */
    $scope.filterRelations = function (id, relationId) {
      var dashboards = $scope.relations.relationsDashboards[id].dashboards;
      var lIndex = '';
      var rIndex = '';

      if (!relationId) {
        return dashboards;
      }
      _.each(indexToDashboardsMap, function (map, index) {
        if (map.indexOf(dashboards[0]) !== -1) {
          lIndex = index;
        }
        if (map.indexOf(dashboards[1]) !== -1) {
          rIndex = index;
        }
        if (!!lIndex && !!rIndex) {
          return false;
        }
      });

      return (!!lIndex || !!rIndex) && !_($scope.relations.relationsIndices).map(function (relInd) {
        if (lIndex && rIndex) {
          if ((lIndex === relInd.indices[0].indexPatternId && rIndex === relInd.indices[1].indexPatternId) ||
              (lIndex === relInd.indices[1].indexPatternId && rIndex === relInd.indices[0].indexPatternId)) {
            return relInd.id;
          }
        } else if (lIndex) {
          if (lIndex === relInd.indices[0].indexPatternId || lIndex === relInd.indices[1].indexPatternId) {
            return relInd.id;
          }
        } else if (rIndex) {
          if (rIndex === relInd.indices[0].indexPatternId || rIndex === relInd.indices[1].indexPatternId) {
            return relInd.id;
          }
        }
      }).compact().contains(relationId);
    };

    /**
     * Returns a unique identifier for the relation between the indices indexa and indexb
     */
    function _getJoinIndicesUniqueID(indexa, indexb) {
      var ia = indexa.indexPatternId.replace(/\//, '-slash-') + '/' + indexa.path.replace(/\//, '-slash-');
      var ib = indexb.indexPatternId.replace(/\//, '-slash-') + '/' + indexb.path.replace(/\//, '-slash-');
      return ia < ib ? ia + '/' + ib : ib + '/' + ia;
    }

    function _getRelationLabel(relationId) {
      var label;

      _.each($scope.relations.relationsIndices, function (relation) {
        if (relation.id === relationId) {
          label = relation.label;
          return false;
        }
      });
      return label;
    }

    /**
     * Updates the relationships between dashboards
     */
    function _updateRelationsDashboards() {
      var g = {
        options: {
          monitorContainerSize: true,
          alwaysShowLinksLabels: true,
          stopAfter: 2000,
          groupingForce: {},
          nodeIcons: {},
          minNodeSize: 30
        },
        nodes: [],
        links: []
      };

      var relationId = function (relation) {
        var i0 = relation.dashboards[0];
        var i1 = relation.dashboards[1];
        return relation.relation + (i0 < i1 ? i0 + i1 : i1 + i0);
      };

      // check for duplicates
      var uniq = _.groupBy($scope.relations.relationsDashboards, function (relation) {
        if (relation.relation) {
          return relationId(relation);
        }
      });

      $scope.invalid = false;
      _.each($scope.relations.relationsDashboards, function (relDash) {
        var error = '';

        if (!!relDash.dashboards[0] && !!relDash.dashboards[1]) {
          if (relDash.relation) {
            var key = relationId(relDash);
            if (uniq[key].length !== 1) {
              error = 'This row has already been defined!';
            }
            // build the graph visualisation
            g.nodes.push({
              id: relDash.dashboards[0],
              label: relDash.dashboards[0],
              nodeType: _getIndexForDashboard(relDash.dashboards[0]),
              size: g.options.minNodeSize
            });
            g.nodes.push({
              id: relDash.dashboards[1],
              label: relDash.dashboards[1],
              nodeType: _getIndexForDashboard(relDash.dashboards[1]),
              size: g.options.minNodeSize
            });
            g.links.push({
              source: relDash.dashboards[0],
              target: relDash.dashboards[1],
              linkType: 'link',
              htmlElement: $('<div>').html(
                  '<div style="width:69px;">' +
                  '<label> ' + _getRelationLabel(relDash.relation) + '</label>' +
                  '</div>').get(0),
              htmlElementWidth: 70,
              htmlElementHeight: 18
            });
          }
        }
        relDash.error = error;
        if (!!error) {
          $scope.invalid = true;
        }
      });
      $scope.dashboardsGraph = g;
    }

    $scope.$watch(function ($scope) {
      return _.map($scope.relations.relationsDashboards, function (relation) {
        return _.omit(relation, [ 'error' ]);
      });
    }, function () {
      if (indexToDashboardsMap === null) {
        urlHelper.getIndexToDashboardMap().then(function (map) {
          indexToDashboardsMap = map;
          _updateRelationsDashboards();
        });
      } else {
        _updateRelationsDashboards();
      }
    }, true);

    $scope.$watch(function ($scope) {
      return _.map($scope.relations.relationsIndices, function (relation) {
        return _.omit(relation, 'error');
      });
    }, function () {
      // each node is an index
      var g = {
        options: {
          monitorContainerSize: true,
          alwaysShowLinksLabels: true,
          stopAfter: 2000,
          groupingForce: {},
          nodeIcons: {},
          minNodeSize: 30
        },
        nodes: [],
        links: []
      };

      // check for duplicates
      var uniq = _.groupBy($scope.relations.relationsIndices, function (relation, offset) {
        var indexa = relation.indices[0];
        var indexb = relation.indices[1];

        if (indexa.indexPatternId && indexa.path && indexb.indexPatternId && indexb.path) {
          return _getJoinIndicesUniqueID(indexa, indexb);
        }
        return offset;
      });

      $scope.invalid = false;
      _.each($scope.relations.relationsIndices, function (relation) {
        var indices = relation.indices;
        var error = '';

        if (indices[0].indexPatternId && indices[0].path && indices[1].indexPatternId && indices[1].path) {
          var key = _getJoinIndicesUniqueID(indices[0], indices[1]);

          if (uniq[key].length !== 1) {
            error = 'This row has already been defined!';
          }
          if (indices[0].indexPatternId === indices[1].indexPatternId &&
              indices[0].path === indices[1].path) {
            error += 'Left and right sides of the relation cannot be the same.';
          }
          relation.id = key;

          if (relation.label) {
            // build the graph visualisation
            g.nodes.push({
              id: indices[0].indexPatternId,
              label: indices[0].indexPatternId,
              nodeType: indices[0].indexPatternId,
              size: g.options.minNodeSize
            });
            g.nodes.push({
              id: indices[1].indexPatternId,
              label: indices[1].indexPatternId,
              nodeType: indices[1].indexPatternId,
              size: g.options.minNodeSize
            });
            g.links.push({
              source: indices[0].indexPatternId,
              target: indices[1].indexPatternId,
              linkType: 'link',
              htmlElement: $('<div>').html(
                  '<div style="width:69px;">' +
                  '<label> ' + relation.label + '</label>' +
                  '</div>').get(0),
              htmlElementWidth: 70,
              htmlElementHeight: 18
            });
          }
        }

        relation.error = error;
        if (!!error) {
          $scope.invalid = true;
        }
      });
      $scope.indicesGraph = g;
    }, true);

    $scope.submit = function (elements) {
      var relations = {
        relationsIndices: _.map($scope.relations.relationsIndices, function (relation) {
          return _.omit(relation, [ 'error' ]);
        }),
        relationsDashboards: _.map($scope.relations.relationsDashboards, function (relation) {
          return _.omit(relation, [ 'error' ]);
        })
      };

      config.set('kibi:relations', relations).then(function () {
        notify.info('Saved the relationships between ' + elements);
      });
    };
  });
});