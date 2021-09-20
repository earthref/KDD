import React from 'react';
import {compose} from '@storybook/react-komposer';

import SearchJSONLD from '/client/modules/kdd/components/search_jsonld';

export const composer = ({es, id}, onData) => {
  onData(null, { item: undefined, id: undefined });
  Meteor.call('esPage', es, 1, 1, (error, results) => {
    try {
      if (error) {
        console.error('JSONLD', error);
        onData(null, { error: error, id: undefined });
      } else if (results.length > 0) {
        onData(null, { item: results[0], id });
      }
    } catch (error) {}
  });
};

export default compose(
  composer,
  {
    propsToWatch: ['es'],
    shouldSubscribe(currentProps, nextProps) {
      return !_.isEqual(currentProps.es, nextProps.es);
    }
  }
)(SearchJSONLD);
