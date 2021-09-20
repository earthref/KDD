import _ from 'lodash';
import $ from 'jquery';
import moment from 'moment';
import Promise from 'bluebird';
import Runner from '/lib/modules/common/runner';

import {versions, models} from '/lib/configs/kdd/data_models';
import {cvs} from '/lib/modules/er/controlled_vocabularies';

let reTrailingS = new RegExp(/s$/);
let reLeadingDoubleUnderscore = new RegExp(/(^__)/);
let reGlobalPeriod = new RegExp(/\./, 'g');
let reControlledVocabulary = new RegExp(/cv\("(.*)"\)/);
let reDictionary = new RegExp(/\s*([^[].+)\[(.+)\]\s*/);
let reNSummaryColumn = new RegExp(/^\_n_/);
let reAgeSummaryColumn = new RegExp(/^_age.*\_y(bp)?$/);
let reGeoSummaryColumn = new RegExp(/^\_geo_/);

let maxValsArrayLength = 100;
let maxExperimentMeasurementRows = 1000;
let maxSummaryMeasurementRows = 1000;

export default class extends Runner {

  constructor({runnerState}) {
    super({runnerState});
  }

  // Return a promise for creating the pre-summary
  preSummarizePromise(contribution, meta) {

    // console.log('preSummarizePromise');

    if (!contribution) {
      this._appendError(`Invalid contribution.`);
      return Promise.resolve();
    }

    this.contribution = contribution;
    this.json = {};
    this.reset();
    this._initProp(this.json, 'contribution', _.merge({ summary: { contribution: { data_model_version: _.last(versions) }}}, meta));

    return this._summarizeTables(true)
      .then(this._getCrossRefData.bind(this))
      .then(this._adoptChildTableCounts.bind(this))
      .then(this._aggregateTableCounts.bind(this))
      .then(this._consolidate.bind(this));

  }
  
  // Return a promise for creating the summary
  summarizePromise(contribution, meta) {

    // console.log('summarizePromise');

    if (!contribution) {
      this._appendError(`Invalid contribution.`);
      return Promise.resolve();
    }

    this.contribution = contribution;
    this.json = {};
    this.reset();
    this._initProp(this.json, 'contribution', _.merge({ summary: { contribution: { data_model_version: _.last(versions) }}}, meta));

    return this._summarizeTables()
      .then(this._getCrossRefData.bind(this))
      .then(this._adoptChildTables.bind(this))
      .then(this._inheritParentTables.bind(this))
      .then(this._aggregateTables.bind(this))
      .then(this._consolidate.bind(this));

  }

  _getCrossRefData() {

    // console.log('_getCrossRefData');

    return new Promise((resolve) => {
      try {
        let doi = _.toUpper(_.trim(this.json.contribution.summary.contribution.reference));
        if (doi === '')
          resolve();
        else
          Meteor.call("getReferenceMetadata", doi, (error, reference) => {
            if (!error) {
              this.json.contribution.summary.contribution._reference = reference;
              // console.log('_getCrossRefData', reference);
            }
            resolve();
          });
      } catch(e) {
        resolve();
      }
    });

  }

  _summarizeTables(onlyCounts) {

    // console.log('_summarizeTables');

    let sortedTables = _.sortBy(_.keys(models[_.last(versions)].tables), (table) => {
      return models[_.last(versions)].tables[table].position;
    });

    return Promise.each(sortedTables, (table, tableIdx) => {

      return new Promise((resolve) => {

        // console.log('summarizing', table);

        let model = models[_.last(versions)].tables[table];

        if (this.contribution[table]) {
          if (table === 'contribution') {
            this.contribution.contribution.forEach((row) => {
              this._copyRowProps(row, this.json.contribution.summary.contribution, model);
            });
          } else {
            let nameColumn = table.replace(reTrailingS, '');
            let parentColumn = sortedTables[tableIdx-1].replace(reTrailingS, '');
            this._initProp(this.json, table, {});
            this.contribution[table].forEach((row) => {
              let name = row[nameColumn] || '';
              let prop = this._nameToProp(name);
              let parent = row[parentColumn] || '';
              let parentProp = this._nameToProp(parent);
              this._initProp(this.json[table], prop, {});
              this._initProp(this.json[table][prop], parentProp, {
                rows: [],
                summary: {
                  [table]: {
                    ['_n_' + table]: 1,
                    _n_results: 0
                  }
                }
              });
              this.json[table][prop][parentProp].rows.push(row);
              if (!onlyCounts) this._summarizeRowProps(row, this.json[table][prop][parentProp].summary[table], model);
              this.json[table][prop][parentProp].summary[table]._n_results += 1;
            });
          }
        }

        resolve();
      }).delay();
    });

  }
  
  _consolidate() {

    // console.log('_consolidate');

    return Promise.each(_.keys(this.json), table => {

      return new Promise((resolve) => {

        // console.log('consolidating', table);

        if (table === "contribution")
          this._consolidateSummary(this.json[table].summary);
        else
          _.keys(this.json[table]).forEach((prop) => {
            _.keys(this.json[table][prop]).forEach((parentProp) => {
              this._consolidateSummary(this.json[table][prop][parentProp].summary);
            });
          });

        resolve();
      }).delay();
    });

  }

  _inheritParentTables() {

    console.log('_inheritParentTables');

    let sortedTables = _.sortBy(_.keys(models[_.last(versions)].tables), (table) => {
      return models[_.last(versions)].tables[table].position;
    });

    return Promise.each(sortedTables, (table) => {

      return new Promise((resolve) => {

        console.log('inheriting', table);

        let model = models[_.last(versions)].tables[table];
        let contributionSummary = _.omitBy(this.json.contribution.summary.contribution, (value, key) => reLeadingDoubleUnderscore.test(key));

        if (table === 'kds') {
          _.keys(this.json[table]).forEach((tableProp) => {
            _.keys(this.json[table][tableProp]).forEach((parentProp) => {
              this.json[table][tableProp][parentProp].summary.contribution = contributionSummary;
            });
          });
        }

        resolve();
      }).delay();
    });

  }

  _adoptContributionChildTables() {
    return this._adoptChildTables('contribution', false);
  }

  _adoptChildTableCounts() {
    return this._adoptChildTables(undefined, true);
  }

  _adoptChildTables(toTable, onlyCounts) {

    // console.log('_adoptChildTables');

    let sortedTables = _.sortBy(_.keys(models[_.last(versions)].tables), (table) => {
      return models[_.last(versions)].tables[table].position;
    });

    return Promise.each(sortedTables, (table) => {

      return new Promise((resolve) => {

        // console.log('adopting', table);

        let model = models[_.last(versions)].tables[table];

        if (table === 'kds') {
          _.keys(this.json.kds).forEach((kdProp) => {
            _.keys(this.json.kds[kdProp]).forEach((prop) => {
              if (!toTable || toTable === 'contribution') {
                this._aggregateSummaries(table,
                  this.json[table][kdProp][prop],
                  this.json.contribution, undefined, onlyCounts
                );
              }
            });
          });
        }
        resolve();

      }).delay();
    });
  }

  _aggregateTableCounts() {
    return this._aggregateTables(true);
  }

  _aggregateTables(onlyCounts) {

    // console.log('_aggregateTables');

    let sortedTables = _.sortBy(_.keys(models[_.last(versions)].tables), (table) => {
      return models[_.last(versions)].tables[table].position;
    });

    return Promise.each(sortedTables, (table) => {

      return new Promise((resolve) => {

        // console.log('aggregating', table);

        if (table === 'contribution') {
          this._initProp(this.json.contribution.summary, '_all', {});
          _.keys(this.json.contribution.summary).forEach((summaryTable) => {
            if (summaryTable !== '_all' && summaryTable !== 'contribution') {
              this._aggregateSummaries(summaryTable,
                this.json.contribution,
                this.json.contribution, '_all', onlyCounts
              );
            }
          });
        } else {
          _.keys(this.json[table]).forEach((prop) => {
            _.keys(this.json[table][prop]).forEach((parentProp) => {
              this._initProp(this.json[table][prop][parentProp].summary, '_all', {});
              _.keys(this.json[table][prop][parentProp].summary).forEach((summaryTable) => {
                if (summaryTable !== '_all' && summaryTable !== 'contribution') {
                  this._aggregateSummaries(summaryTable,
                    this.json[table][prop][parentProp],
                    this.json[table][prop][parentProp], '_all', onlyCounts
                  );
                }
              });
            });
          });
        }

        resolve();

      }).delay();
    });
  }

  _nameToProp(name) {
    return '_' + _.trim(name).replace(reGlobalPeriod, '_');
  }

  _initProp(object, property, initValue) {
    if (!_.has(object, property)) object[property] = initValue;
  }

  _copyRowProps(row, summary, model) {

    if (!summary) {
      this._appendError(`Invalid summary.`);
      return;
    }
    if (!model || !model.columns) {
      this._appendError(`Invalid data model.`);
      return;
    }

    _.keys(row).forEach((column) => {
      if (model.columns[column] && model.columns[column].type === 'List') {
        this._initProp(summary, column, []);
        if (row[column] && row[column].split) row[column].split(':').forEach((val) => {
          summary[column][_.trim(val)] = true;
        });
      } else if (model.columns[column] && model.columns[column].type === 'Number') {
        if (summary[column] === undefined) summary[column] = parseFloat(row[column]);
      } else if (model.columns[column] && model.columns[column].type === 'Integer') {
        if (summary[column] === undefined) summary[column] = parseInt(row[column]);
      } else if (model.columns[column] && model.columns[column].type === 'String') {
        if (summary[column] === undefined) summary[column] = _.trim(row[column]);
      } else if (model.columns[column] && model.columns[column].type === 'Timestamp') {
        if (summary[column] === undefined) summary[column] = _.trim(row[column]);
      } else if (model.columns[column]) {
        this._appendError(`Unrecognized data model type "${model.columns[column].type}".`);
      } else {
        this._appendWarning(`Unrecognized data model column "${column}".`);
      }
    });
  }

  _summarizeRowProps(row, summary, model) {
    if (!summary) {
      this._appendError(`Invalid summary.`);
      return;
    }
    if (!model || !model.columns) {
      this._appendError(`Invalid data model.`);
      return;
    }

    ['age', 'age_low', 'age_high'].forEach((column) => {
      if (row.age_unit !== undefined && !isNaN(parseFloat(row[column]))) {
        let age = parseFloat(row[column]);
        let ybpColumn = '_' + column + '_ybp';
        if (!isNaN(age)) {
          let age_ybp;
          if (row.age_unit === 'Ga'                ) age_ybp = 1e9*age;
          if (row.age_unit === 'Ma'                ) age_ybp = 1e6*age;
          if (_.toLower(row.age_unit) === 'ka'     ) age_ybp = 1e3*age;
          if (row.age_unit === 'Years AD (+/-)'    ) age_ybp = 1950 - age;
          if (row.age_unit === 'Years BP'          ) age_ybp = age;
          if (row.age_unit === 'Years Cal AD (+/-)') age_ybp = 1950 - age;
          if (row.age_unit === 'Years Cal BP'      ) age_ybp = age;
          if (age_ybp !== undefined) {
            this._summerizeNumber(summary, ybpColumn, age_ybp);
            this._summerizeNumber(summary, '_age_range_ybp', age_ybp);
          }
        }
      }
    });

    if (row.age_unit !== undefined && !isNaN(parseFloat(row.age_sigma))) {
      let age_sigma = parseFloat(row.age_sigma);
      if (!isNaN(age_sigma)) {
        let age_sigma_y;
        if (row.age_unit === 'Ga'                ) age_sigma_y = 1e9*age_sigma;
        if (row.age_unit === 'Ma'                ) age_sigma_y = 1e6*age_sigma;
        if (_.toLower(row.age_unit) === 'ka'     ) age_sigma_y = 1e3*age_sigma;
        if (row.age_unit === 'Years AD (+/-)'    ) age_sigma_y = age_sigma;
        if (row.age_unit === 'Years BP'          ) age_sigma_y = age_sigma;
        if (row.age_unit === 'Years Cal AD (+/-)') age_sigma_y = age_sigma;
        if (row.age_unit === 'Years Cal BP'      ) age_sigma_y = age_sigma;
        if (age_sigma_y !== undefined) {
          this._summerizeNumber(summary, '_age_sigma_y', age_sigma_y);
        }
      }
    }

    if (!isNaN(parseFloat(row.lon)) &&
        !isNaN(parseFloat(row.lat))) {
      let lon = parseFloat(row.lon);
      let lat = parseFloat(row.lat);
      if (lat <= 90 && lat >= -90) {
        while (lon < -180) lon += 360;
        while (lon >  180) lon -= 360;
        this._initProp(summary, '_geo_point', []);
        if (summary._geo_point.length < maxValsArrayLength)
          summary._geo_point.push({ type: 'point', coordinates: [lon, lat] });
        this._initProp(summary, '_has_geo', "true");
      }
    }

    if (!isNaN(parseFloat(row.lon_w)) &&
        !isNaN(parseFloat(row.lat_n)) &&
        !isNaN(parseFloat(row.lon_e)) &&
        !isNaN(parseFloat(row.lat_s))) {
      let lon_w = parseFloat(row.lon_w);
      let lat_n = parseFloat(row.lat_n);
      let lon_e = parseFloat(row.lon_e);
      let lat_s = parseFloat(row.lat_s);
      if (lat_n <= 90 && lat_n >= -90 && lat_s <= 90 && lat_s >= -90) {
        while (lon_w < -180) lon_w += 360;
        while (lon_w >  180) lon_w -= 360;
        while (lon_e < -180) lon_e += 360;
        while (lon_e >  180) lon_e -= 360;
        this._initProp(summary, '_geo_envelope', []);
        if (summary._geo_envelope.length < maxValsArrayLength)
          summary._geo_envelope.push({ type: 'envelope', coordinates: [ [lon_w, lat_n], [lon_e, lat_s] ] });
        this._initProp(summary, '_has_geo', "true");
      }
    }

    _.keys(row).forEach((column) => {
      if (!model.columns[column]) {
        this._appendWarning(`Unrecognized data model column "${column}".`);
      } else {
        if (model.columns[column].type === 'List') {
          if (summary[column] === undefined || _.isPlainObject(summary[column])) {
            if (row[column] && row[column].split) row[column].split(':').slice(0, maxValsArrayLength).forEach((val) => {
              if (_.trim(val) !== '') {
                this._initProp(summary, column, {});
                summary[column][_.trim(val)] = true;
                if (_.keys(summary[column]).length >= maxValsArrayLength)
                  summary[column] = _.keys(summary[column]);
              }
            });
          }
        } else if (model.columns[column].type === 'Number') {
          if (!isNaN(parseFloat(row[column]))) {
            this._summerizeNumber(summary, column, parseFloat(row[column]));
          }
        } else if (model.columns[column].type === 'Integer') {
          if (!isNaN(parseInt(row[column]))) {
            this._summerizeNumber(summary, column, parseFloat(row[column]));
          }
        } else if (model.columns[column].type === 'String' || model.columns[column].type === 'Matrix') {
          if (_.trim(row[column]) !== '') {
            this._initProp(summary, column, {});
            if (_.keys(summary[column]).length < maxValsArrayLength) {
              let val;
              if (model.columns[column].unit === 'Flag' && model.columns[column].validations) {
                model.columns[column].validations.forEach((validation) => {
                  let match = validation.match(reControlledVocabulary);
                  if (val === undefined && match && match.length > 1 && cvs[match[1]] && cvs[match[1]].items) {
                    cvs[match[1]].items.forEach((cvItem) => {
                      if (val === undefined && cvItem.item && cvItem.item.toLowerCase() === _.trim(row[column]).toLowerCase())
                        val = cvItem.label;
                    });
                  }
                });
              }
              summary[column][val !== undefined ? val : _.trim(row[column])] = true;
            }
          }
        } else if (model.columns[column].type === 'Timestamp') {
          let dt = moment(_.trim(row[column]), ['YYYY', moment.ISO_8601], true);
          if (dt.isValid()) {
            this._summerizeNumber(summary, column, dt.valueOf());
          }
        } else if (model.columns[column].type === 'Dictionary') {
          if (row[column] && row[column].split) row[column].split(':').forEach((val) => {
            let match = val.match(reDictionary);
            if (match && match.length > 2) {
              this._initProp(summary, column, []);
              if (summary[column].length < maxValsArrayLength)
                summary[column].push({key: match[1], value: match[2]});
            }
          });
        } else {
          this._appendError(`Unrecognized data model type "${model.columns[column].type}".`);
        }
      }
    });
  }

  _summerizeNumber(summary, column, val) {
    if (_.isPlainObject(val) && val.vals && val.n && 
      val.range && val.range.gte !== undefined && val.range.lte !== undefined
    ) {
      this._initProp(summary, column, { vals: {}, n: 0, range: { gte: undefined, lte: undefined }});
      summary[column].n += val.n;
      if (_.isPlainObject(summary[column].vals)) {
        let vals = (_.isArray(val.vals) ? val.vals : (_.isPlainObject(val.vals) ? _.keys(val.vals) : []));
        vals.forEach(v => {
          if (_.isPlainObject(summary[column].vals)) {
            summary[column].vals[v] = true;
            if (_.keys(summary[column].vals).length >= maxValsArrayLength)
              summary[column].vals = _.keys(summary[column].vals).map(x => parseFloat(x));
          }
        });
      }
      if (summary[column].range.gte === undefined || summary[column].range.gte > val.range.gte) {
        summary[column].range.gte = val.range.gte;
      }
      if (summary[column].range.lte === undefined || summary[column].range.lte < val.range.lte) {
        summary[column].range.lte = val.range.lte;
      }
    } else if (_.isArray(val)) {
      val.forEach(v => this._summerizeNumber(summary, column, v));
    } else if (_.isNumber(val)) {
      if (column[0] !== '_' || reAgeSummaryColumn.test(column)) {
        this._initProp(summary, column, { vals: {}, n: 0, range: { gte: undefined, lte: undefined }});
        summary[column].n ++;
        if (_.isPlainObject(summary[column].vals)) {
          summary[column].vals[val] = true;
          if (_.keys(summary[column].vals).length >= maxValsArrayLength)
            summary[column].vals = _.keys(summary[column].vals).map(x => parseFloat(x));
        }
        if (summary[column].range.gte === undefined || summary[column].range.gte > val) {
          if (val < 1e18 || parseFloat(val).toExponential() === parseFloat(val).toString())
            summary[column].range.gte = val;
        }
        if (summary[column].range.lte === undefined || summary[column].range.lte < val) {
          if (val < 1e18 || parseFloat(val).toExponential() === parseFloat(val).toString())
            summary[column].range.lte = val;
        }
      } else {
        this._initProp(summary, column, []);
        summary[column].push(val);
      }
    }
  }

  _consolidateSummary(summary) {
    _.keys(summary).forEach(table => {
      _.keys(summary[table]).forEach(column => {
        if (_.isPlainObject(summary[table][column]) && _.isPlainObject(summary[table][column].vals)) {
          summary[table][column].vals = _.keys(summary[table][column].vals).map(x => parseFloat(x));
        } else if (_.isPlainObject(summary[table][column]) && !_.isArray(summary[table][column].vals) && column[0] !== '_') {
          summary[table][column] = _.keys(summary[table][column]);
        }
      });
    });
  }
  
  _aggregateSummaries(fromName, from, to, toName, onlyCounts) {
    let model = models[_.last(versions)].tables[fromName === 'experiments' ? 'measurements' : fromName];
    toName = toName || fromName;
    if (model && from && from.summary && from.summary[fromName] && to) {
      this._initProp(to, 'summary', {});
      this._initProp(to.summary, toName, {});
      to.summary._incomplete_summary = (onlyCounts === true ? "true" : "false");
      _.keys(from.summary[fromName]).forEach((column) => {
        if (reNSummaryColumn.test(column)) {
          this._initProp(to.summary[toName], column, 0);
          to.summary[toName][column] += from.summary[fromName][column];
        }
        if (onlyCounts !== true) {
          if (model.columns[column]) {
            if (model.columns[column].type === 'Number' ||
                model.columns[column].type === 'Integer' ||
                model.columns[column].type === 'Timestamp' ||
                model.columns[column].type === 'Dictionary') {
              this._summerizeNumber(to.summary[toName], column, from.summary[fromName][column]);
            } else {
              this._initProp(to.summary[toName], column, {});
              if (_.isPlainObject(to.summary[toName][column])) {
                let vals = from.summary[fromName][column];
                vals = (_.isArray(vals) ? vals : (_.isPlainObject(vals) ? _.keys(vals) : []));
                vals.forEach(v => {
                  if (_.isPlainObject(to.summary[toName][column])) {
                    to.summary[toName][column][v] = true;
                    if (_.keys(to.summary[toName][column]).length >= maxValsArrayLength)
                    to.summary[toName][column] = _.keys(to.summary[toName][column]);
                  }
                });
              }
            }
          }
          if (reAgeSummaryColumn.test(column)) {
            this._summerizeNumber(to.summary[toName], column, from.summary[fromName][column]);
          }
          if (reGeoSummaryColumn.test(column)) {
            this._initProp(to.summary[toName], column, []);
            if (to.summary[toName][column].length < maxValsArrayLength) {
              let geos = to.summary[toName][column].concat(from.summary[fromName][column]);
              to.summary[toName][column] = _.uniqBy(geos, JSON.stringify).slice(0, maxValsArrayLength);
            }
            this._initProp(to.summary[toName], '_has_geo', "true");
          }
        }
      });
    }
  };

}
