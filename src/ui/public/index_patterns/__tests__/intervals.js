let pluck = require('lodash').pluck;
let moment = require('moment');

describe('Index Patterns', function () {
  describe('interval.toIndexList()', function () {
    let expect = require('expect.js');
    let ngMock = require('ngMock');

    let intervals;
    beforeEach(ngMock.module('kibana'));
    beforeEach(ngMock.inject(function (Private) {
      intervals = Private(require('ui/index_patterns/_intervals'));
    }));

    it('should return correct indices for hourly [logstash-]YYYY.MM.DD.HH', function () {
      let start = moment.utc('2014-01-01T07:00:00Z');
      let end = moment.utc('2014-01-01T08:30:00Z');
      let interval = { name: 'hours', startOf: 'hour', display: 'Hourly' };
      let list = intervals.toIndexList('[logstash-]YYYY.MM.DD.HH', interval, start, end);
      expect(list).to.eql([
        {
          index: 'logstash-2014.01.01.07',
          min: moment.utc('2014-01-01T07:00:00').valueOf(),
          max: moment.utc('2014-01-01T07:59:59.999').valueOf(),
        },
        {
          index: 'logstash-2014.01.01.08',
          min: moment.utc('2014-01-01T08:00:00').valueOf(),
          max: moment.utc('2014-01-01T08:59:59.999').valueOf(),
        }
      ]);
    });

    it('should return correct indices for daily [logstash-]YYYY.MM.DD', function () {
      let start = moment(1418244231248);
      let end = moment(1418849261281);
      let interval = { name: 'days', startOf: 'day', display: 'Daily' };
      let list = intervals.toIndexList('[logstash-]YYYY.MM.DD', interval, start, end);
      expect(list).to.eql([
        {
          index: 'logstash-2014.12.10',
          min: moment.utc('2014-12-10T00:00:00').valueOf(),
          max: moment.utc('2014-12-10T23:59:59.999').valueOf(),
        },
        {
          index: 'logstash-2014.12.11',
          min: moment.utc('2014-12-11T00:00:00').valueOf(),
          max: moment.utc('2014-12-11T23:59:59.999').valueOf(),
        },
        {
          index: 'logstash-2014.12.12',
          min: moment.utc('2014-12-12T00:00:00').valueOf(),
          max: moment.utc('2014-12-12T23:59:59.999').valueOf(),
        },
        {
          index: 'logstash-2014.12.13',
          min: moment.utc('2014-12-13T00:00:00').valueOf(),
          max: moment.utc('2014-12-13T23:59:59.999').valueOf(),
        },
        {
          index: 'logstash-2014.12.14',
          min: moment.utc('2014-12-14T00:00:00').valueOf(),
          max: moment.utc('2014-12-14T23:59:59.999').valueOf(),
        },
        {
          index: 'logstash-2014.12.15',
          min: moment.utc('2014-12-15T00:00:00').valueOf(),
          max: moment.utc('2014-12-15T23:59:59.999').valueOf(),
        },
        {
          index: 'logstash-2014.12.16',
          min: moment.utc('2014-12-16T00:00:00').valueOf(),
          max: moment.utc('2014-12-16T23:59:59.999').valueOf(),
        },
        {
          index: 'logstash-2014.12.17',
          min: moment.utc('2014-12-17T00:00:00').valueOf(),
          max: moment.utc('2014-12-17T23:59:59.999').valueOf(),
        },
      ]);
    });

    it('should return correct indices for monthly [logstash-]YYYY.MM', function () {
      let start = moment.utc('2014-12-01');
      let end = moment.utc('2015-02-01');
      let interval = { name: 'months', startOf: 'month', display: 'Monthly' };
      let list = intervals.toIndexList('[logstash-]YYYY.MM', interval, start, end);
      expect(list).to.eql([
        {
          index: 'logstash-2014.12',
          min: moment.utc(0).year(2014).month(11).valueOf(),
          max: moment.utc(0).year(2015).month(0).subtract(1, 'ms').valueOf(),
        },
        {
          index: 'logstash-2015.01',
          min: moment.utc(0).year(2015).month(0).valueOf(),
          max: moment.utc(0).year(2015).month(1).subtract(1, 'ms').valueOf(),
        },
        {
          index: 'logstash-2015.02',
          min: moment.utc(0).year(2015).month(1).valueOf(),
          max: moment.utc(0).year(2015).month(2).subtract(1, 'ms').valueOf(),
        },
      ]);
    });

    it('should return correct indices for yearly [logstash-]YYYY', function () {
      let start = moment.utc('2014-12-01');
      let end = moment.utc('2015-02-01');
      let interval = { name: 'years', startOf: 'year', display: 'Yearly' };
      let list = intervals.toIndexList('[logstash-]YYYY', interval, start, end);
      expect(list).to.eql([
        {
          index: 'logstash-2014',
          min: moment.utc(0).year(2014).valueOf(),
          max: moment.utc(0).year(2015).subtract(1, 'ms').valueOf(),
        },
        {
          index: 'logstash-2015',
          min: moment.utc(0).year(2015).valueOf(),
          max: moment.utc(0).year(2016).subtract(1, 'ms').valueOf(),
        },
      ]);
    });

    context('with sortDirection=asc', function () {
      it('returns values in ascending order', function () {
        let start = moment.utc('2014-12-01');
        let end = moment.utc('2015-02-01');
        let interval = { name: 'years', startOf: 'year', display: 'Yearly' };
        let list = intervals.toIndexList('[logstash-]YYYY', interval, start, end, 'asc');
        expect(list).to.eql([
          {
            index: 'logstash-2014',
            min: moment.utc(0).year(2014).valueOf(),
            max: moment.utc(0).year(2015).subtract(1, 'ms').valueOf(),
          },
          {
            index: 'logstash-2015',
            min: moment.utc(0).year(2015).valueOf(),
            max: moment.utc(0).year(2016).subtract(1, 'ms').valueOf(),
          },
        ]);
      });
    });

    context('with sortDirection=desc', function () {
      it('returns values in descending order', function () {
        let start = moment.utc('2014-12-01');
        let end = moment.utc('2015-02-01');
        let interval = { name: 'years', startOf: 'year', display: 'Yearly' };
        let list = intervals.toIndexList('[logstash-]YYYY', interval, start, end, 'desc');
        expect(list).to.eql([
          {
            index: 'logstash-2015',
            min: moment.utc(0).year(2015).valueOf(),
            max: moment.utc(0).year(2016).subtract(1, 'ms').valueOf(),
          },
          {
            index: 'logstash-2014',
            min: moment.utc(0).year(2014).valueOf(),
            max: moment.utc(0).year(2015).subtract(1, 'ms').valueOf(),
          },
        ]);
      });
    });
  });
});
