import React from 'react';
import {Link} from 'react-router-dom';
import {Grid, Message} from 'semantic-ui-react';

import IconButton from '/client/modules/common/components/icon_button';
import SearchDividedList from '/client/modules/common/containers/search_divided_list';
import SearchSummariesListItem from '/client/modules/kdd/containers/search_summaries_list_item';
import News from '/client/modules/kdd/components/home_news';
import {levels} from '/lib/configs/kdd/search_levels.js';

export default class extends React.Component {

  constructor(props) {
    super(props);
    this.initialState = {
      loaded: false
    };
    this.state = this.initialState;
  }

  render() {
    return (
      <React.Fragment>
        <Grid divided><Grid.Row><Grid.Column width={12}>
          <div className="ui three cards">
            <IconButton className="card" link="/KdD/search" portal="GERM">
              <i className="large icons">
                <i className="database icon"/>
                <i className="corner search icon"/>
              </i>
              <div className="title">Search Interface</div>
              <div className="subtitle">Browse, combine, and save datasets.</div>
            </IconButton>
            <IconButton className="card" link="/KdD/upload" portal="GERM">
              <i className="large icons">
                <i className="table icon"/>
                <i className="corner add icon"/>
              </i>
              <div className="title">Upload Tool</div>
              <div className="subtitle">Import data into your private workspace.</div>
            </IconButton>
            <IconButton className="card" link="/KdD/private" portal="GERM">
              <i className="large icons">
                <i className="file text outline icon"/>
                <i className="corner checkmark icon"/>
              </i>
              <div className="title">Private Workspace</div>
              <div className="subtitle">Manage your contributions to KdD.</div>
            </IconButton>
          </div>
          <h2 className="ui horizontal divider header" style={{marginBottom: 0}}>
            KdD Resources
          </h2>
          <div className="ui three cards" style={{marginTop: 0}}>
            <IconButton className="borderless card" link="/KdD/data-models/1.0" portal="GERM">
              <i className="icons">
                <i className="sitemap icon"/>
                <i className="corner table icon"/>
              </i>
              <div className="small title">Data<br/>Models</div>
            </IconButton>
            <IconButton className="borderless card" link="/KdD/method-codes" portal="GERM">
              <i className="icons">
                <i className="lab icon"/>
                <i className="corner write icon"/>
              </i>
              <div className="small title">Method<br/>Codes</div>
            </IconButton>
            <IconButton className="borderless card" link="/vocabularies" portal="GERM">
              <i className="icons">
                <i className="list icon"/>
                <i className="corner info icon"/>
              </i>
              <div className="small title">Vocabulary<br/>Lists</div>
            </IconButton>
          </div>
          <h2 className="ui horizontal divider header">
            Recent Contributions
          </h2>
          <SearchDividedList
            es={_.extend({}, levels[0].views[0].es, { sort: [{'summary.contribution.timestamp': 'desc'}]})}
            pageSize={4}
            pageNumber={1}
          >
            <SearchSummariesListItem table="contribution"/>
          </SearchDividedList>
          <IconButton className="small card" link="/KdD/search" portal="GERM" style={{margin:0}}>
            <div className="small title">View More Contributions in the KdD Search Interface</div>
          </IconButton>
        </Grid.Column>
        <Grid.Column width={4}>
          <News/>
        </Grid.Column></Grid.Row></Grid>
      </React.Fragment>
    );
  }

  renderCommunity() {
    return (
      <div>
        <h2 className="ui horizontal divider header">
          MagIC Community
        </h2>
        <div className="ui hidden divider"></div>
        <div className="ui three stackable cards">
          <div className="card">
            <div className="content">
              <div className="header">Recent Contributions</div>
              <div className="ui divided relaxed items">
                <a className="item">
                  <div className="ui tiny image">
                    <img className="ui bordered image" src="/MagIC/plot.png" style={{border:'1px solid rgba(0, 0, 0, 0.1)'}}/>
                  </div>
                  <div className="content">
                    <h5 className="ui header">Selkin, P.A., Gee, J.S. and Tauxe, L. (2007).</h5>
                    <div className="description">
                      Nonlinear thermoremanence acquisition and implications for paleointensity data. EPSL.
                    </div>
                  </div>
                </a>
                <a className="item">
                  <div className="ui tiny image">
                    <img className="ui bordered image" src="/MagIC/plot.png" style={{border:'1px solid rgba(0, 0, 0, 0.1)'}}/>
                  </div>
                  <div className="content">
                    <h5 className="ui header">Selkin, P.A., Gee, J.S. and Tauxe, L. (2007).</h5>
                    <div className="description">
                      Nonlinear thermoremanence acquisition and implications for paleointensity data. EPSL.
                    </div>
                  </div>
                </a>
                <a className="item">
                  <div className="ui tiny image">
                    <img className="ui bordered image" src="/MagIC/plot.png" style={{border:'1px solid rgba(0, 0, 0, 0.1)'}}/>
                  </div>
                  <div className="content">
                    <h5 className="ui header">Selkin, P.A., Gee, J.S. and Tauxe, L. (2007).</h5>
                    <div className="description">
                      Nonlinear thermoremanence acquisition and implications for paleointensity data. EPSL.
                    </div>
                  </div>
                </a>
                <a className="item">
                  <div className="ui tiny image">
                    <img className="ui bordered image" src="/MagIC/plot.png" style={{border:'1px solid rgba(0, 0, 0, 0.1)'}}/>
                  </div>
                  <div className="content">
                    <h5 className="ui header">Selkin, P.A., Gee, J.S. and Tauxe, L. (2007).</h5>
                    <div className="description">
                      Nonlinear thermoremanence acquisition and implications for paleointensity data. EPSL.
                    </div>
                  </div>
                </a>
                <a className="item">
                  <div className="ui tiny image">
                    <img className="ui bordered image" src="/MagIC/plot.png" style={{border:'1px solid rgba(0, 0, 0, 0.1)'}}/>
                  </div>
                  <div className="content">
                    <h5 className="ui header">Selkin, P.A., Gee, J.S. and Tauxe, L. (2007).</h5>
                    <div className="description">
                      Nonlinear thermoremanence acquisition and implications for paleointensity data. EPSL.
                    </div>
                  </div>
                </a>
                <a className="item">
                  <div className="ui tiny image">
                    <img className="ui bordered image" src="/MagIC/plot.png" style={{border:'1px solid rgba(0, 0, 0, 0.1)'}}/>
                  </div>
                  <div className="content">
                    <h5 className="ui header">Selkin, P.A., Gee, J.S. and Tauxe, L. (2007).</h5>
                    <div className="description">
                      Nonlinear thermoremanence acquisition and implications for paleointensity data. EPSL.
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="content">
              <div className="header">MagIC News</div>
            </div>
          </div>
          <div className="card">
            <div className="content">
              <div className="header">Gpmag List</div>
              <div className="ui divided feed relaxed items">
                <a className="event item">
                  <div className="content">
                    <div className="summary">
                      Guillaume St-Onge, PhD
                      <div className="date">5 days ago</div>
                    </div>
                    <div className="extra text">
                      Postdoctoral fellowship in paleomagnetism at the Institut des sciences de la mer de Rimouski (ISMER)
                    </div>
                  </div>
                </a>
                <a className="event item">
                  <div className="content">
                    <div className="summary">
                      Guillaume St-Onge, PhD
                      <div className="date">5 days ago</div>
                    </div>
                    <div className="extra text">
                      Postdoctoral fellowship in paleomagnetism at the Institut des sciences de la mer de Rimouski (ISMER)
                    </div>
                  </div>
                </a>
                <a className="event item">
                  <div className="content">
                    <div className="summary">
                      Guillaume St-Onge, PhD
                      <div className="date">5 days ago</div>
                    </div>
                    <div className="extra text">
                      Postdoctoral fellowship in paleomagnetism at the Institut des sciences de la mer de Rimouski (ISMER)
                    </div>
                  </div>
                </a>
                <a className="event item">
                  <div className="content">
                    <div className="summary">
                      Guillaume St-Onge, PhD
                      <div className="date">5 days ago</div>
                    </div>
                    <div className="extra text">
                      Postdoctoral fellowship in paleomagnetism at the Institut des sciences de la mer de Rimouski (ISMER)
                    </div>
                  </div>
                </a>
                <a className="event item">
                  <div className="content">
                    <div className="summary">
                      Guillaume St-Onge, PhD
                      <div className="date">5 days ago</div>
                    </div>
                    <div className="extra text">
                      Postdoctoral fellowship in paleomagnetism at the Institut des sciences de la mer de Rimouski (ISMER)
                    </div>
                  </div>
                </a>
                <a className="event item">
                  <div className="content">
                    <div className="summary">
                      Guillaume St-Onge, PhD
                      <div className="date">5 days ago</div>
                    </div>
                    <div className="extra text">
                      Postdoctoral fellowship in paleomagnetism at the Institut des sciences de la mer de Rimouski (ISMER)
                    </div>
                  </div>
                </a>
                <a className="event item">
                  <div className="content">
                    <div className="summary">
                      Guillaume St-Onge, PhD
                      <div className="date">5 days ago</div>
                    </div>
                    <div className="extra text">
                      Postdoctoral fellowship in paleomagnetism at the Institut des sciences de la mer de Rimouski (ISMER)
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </div>
          <h2 className="ui horizontal divider header">
            MagIC Links
          </h2>
          <div className="ui hidden divider"></div>
        </div>
      </div>
    );
  }

}

