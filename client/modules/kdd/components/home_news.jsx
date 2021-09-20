import React from 'react';
import {Link} from 'react-router-dom';
import {Image, Message} from 'semantic-ui-react';

import {portals} from '/lib/configs/portals.js';

export default class extends React.Component {

  render() {
    return (
      <div style={{textAlign: "justify"}}>
        <h3>
          <Image size="mini" src="/KdD/FIESTA.png" floated="left"/>
          {` EarthRef FIESTA`}
        </h3>
        <p>
          The Geochemical Earth Reference Model (GERM) Partition Coefficients Database (KdD) has been upgraded to use 
          EarthRef's new <b><a href="https://earthref.org/FIESTA">FIESTA software</a></b> to 
          support <b><a href="https://earthref.org/KdD/private">private workspace</a></b> versioned 
          uploads validated against the KdD <b><a href="https://earthref.org/KdD/data-models">data model</a></b> and a  
          full-text <b><a href="https://earthref.org/KdD/search">search interface</a></b> with filters and compilation 
          downloads. For the time being, the old KdD site will be kept online <b><a href="https://earthref.org/KDD-old">here</a></b>, 
          but new contributions to the repository will only be in the new system.
        </p>
      </div>
    );
  }

}
