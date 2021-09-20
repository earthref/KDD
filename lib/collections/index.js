import _ from 'lodash';
import {Mongo} from 'meteor/mongo';
import {versions, models} from '/lib/configs/kdd/data_models';

let model = models[_.last(versions)];
let sortedTables = _.sortBy(_.keys(models[_.last(versions)].tables), (table) => {
  return models[_.last(versions)].tables[table].position;
});

// Create a
class CollectionsCompiler {
  constructor() {
    this.collections = {};
    this.definitions = {};
  }
  add(portal, type, level, set, definition) {
    definition.recordSet = `${portal}.${type}.${level}.${set}`;
    this.collections[definition.recordSet] = new Mongo.Collection(definition.recordSet);
    _.set(this.definitions, definition.recordSet, definition);
  }
}

const maxFilterBuckets = 100;
let c = new CollectionsCompiler();

c.collections['kdd.private.contributions'] = new Mongo.Collection('kdd.private.contributions');
c.collections['kdd.import.settings.templates'] = new Mongo.Collection('kdd.import.settings.templates');
c.collections['kdd.import.settings.templates.subscription'] = new Mongo.Collection('kdd.import.settings.templates.subscription');

const Collections = c.collections;
const collectionDefinitions = c.definitions;

export {Collections, collectionDefinitions};