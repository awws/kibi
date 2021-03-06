var Promise = require('bluebird');
var expect = require('expect.js');
var sinon = require('sinon');
var PostgresQuery = require('../../queries/postgres_query');

var fakeServer = {
  log: function (tags, data) {},
  config: function () {
    return {
      get: function (key) {
        if (key === 'elasticsearch.url') {
          return 'http://localhost:12345';
        } else if (key === 'kibana.index') {
          return '.kibi';
        } else {
          return '';
        }
      }
    };
  },
  plugins: {
    elasticsearch: {
      client: {
        search: function () {
          return Promise.reject(new Error('Document does not exists'));
        }
      }
    }
  }
};

var cacheMock = {
  get: function (key) { return '';},
  set: function (key, value, time) {}
};

var queryDefinition = {
  activationQuery: 'select * from x LIMIT 1',
  resultQuery: 'select * from x',
  datasource: {
    datasourceClazz: {
      getConnectionString: function () { return 'connectionString';},
      datasource: {
        datasourceParams: {
          cache_enabled: true,
          host: 'localhost',
          dbname: 'mydb'
        }
      },
      populateParameters: function () {
        return '';
      }
    }
  }
};

describe('PostgresQuery', function () {

  describe('correct arguments are passed to generateCacheKey', function () {

    it('fetchResults', function (done) {
      var postgresQuery = new PostgresQuery(fakeServer, queryDefinition, cacheMock);
      // stub _execute queryto skip query execution
      sinon.stub(postgresQuery, '_executeQuery', function () {
        return Promise.resolve({fields: [], rows: []});
      });

      var spy = sinon.spy(postgresQuery, 'generateCacheKey');

      postgresQuery.fetchResults({credentials: {username: 'fred'}}, false, 'variableX').then(function (res) {
        expect(res.results).to.eql({ bindings: []});
        expect(spy.callCount).to.equal(1);

        expect(spy.calledWithExactly('localhostmydb', 'select * from x', false, 'variableX', 'fred')).to.be.ok();

        postgresQuery._executeQuery.restore();
        postgresQuery.generateCacheKey.restore();
        done();
      }).catch(done);
    });

    it('checkIfItIsRelevant', function (done) {
      var postgresQuery = new PostgresQuery(fakeServer, queryDefinition, cacheMock);
      // stub _execute queryto skip query execution
      sinon.stub(postgresQuery, '_executeQuery', function () {
        return Promise.resolve({fields: [], rows: []});
      });

      var spy = sinon.spy(postgresQuery, 'generateCacheKey');

      postgresQuery.checkIfItIsRelevant({credentials: {username: 'fred'}}).then(function (res) {
        expect(res).to.equal(false);
        expect(spy.callCount).to.equal(1);

        expect(spy.calledWithExactly('localhostmydb', 'select * from x LIMIT 1', 'fred')).to.be.ok();

        postgresQuery._executeQuery.restore();
        postgresQuery.generateCacheKey.restore();
        done();
      }).catch(done);
    });

  });

});
