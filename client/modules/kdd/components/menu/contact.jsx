import React from 'react';
import {Item} from 'semantic-ui-react';

import UserItem from '/client/modules/common/components/user_item';

export default class extends React.Component {

  render() {
    return (
      <div>
        <Item.Group divided>
          <UserItem portal="GERM" id="njarboe"/>
          <UserItem portal="GERM" id="rminnett"/>
          <UserItem portal="GERM" id="ljonestrask"/>
          <UserItem portal="GERM" id="cconstable"/>
          <UserItem portal="GERM" id="akoppers"/>
          <UserItem portal="GERM" id="ltauxe"/>
        </Item.Group>
      </div>
	  );
  }

}
