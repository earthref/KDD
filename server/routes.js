import {Picker } from 'meteor/meteorhacks:picker';

import { cvs } from '/lib/modules/er/controlled_vocabularies';
import { svs } from '/lib/modules/er/suggested_vocabularies';
import { methodCodes } from '/lib/configs/kdd/method_codes';
import { models } from '/lib/configs/kdd/data_models';


Picker.route('/KdD/data-models/1.0.json', function(params, request, response, next) {
  response.setHeader('Content-Type', "text/plain;charset=utf-8");
  response.statusCode = 200;
  response.end(JSON.stringify(models['1.0'], null, '\t'));
});