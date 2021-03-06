describe('Color Format', function () {
  let fieldFormats;
  let ColorFormat;
  let expect = require('expect.js');
  let ngMock = require('ngMock');

  beforeEach(ngMock.module('kibana'));
  beforeEach(ngMock.inject(function (Private) {
    fieldFormats = Private(require('ui/registry/field_formats'));
    ColorFormat = fieldFormats.getType('color');

  }));

  it('should add colors if the value is in range', function () {
    let colorer = new ColorFormat({
      colors: [{
        range: '100:150',
        text: 'blue',
        background: 'yellow'
      }]
    });
    expect(colorer.convert(99, 'html')).to.eql('99');
    expect(colorer.convert(100, 'html')).to.eql('<span style="color: blue;background-color: yellow;">100</span>');
    expect(colorer.convert(150, 'html')).to.eql('<span style="color: blue;background-color: yellow;">150</span>');
    expect(colorer.convert(151, 'html')).to.eql('151');
  });

  it('should not convert invalid ranges', function () {
    let colorer = new ColorFormat({
      colors: [{
        range: '100150',
        text: 'blue',
        background: 'yellow'
      }]
    });
    expect(colorer.convert(99, 'html')).to.eql('99');
  });
});
