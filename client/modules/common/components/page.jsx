import React from 'react';
import PropTypes from 'prop-types';
import {Link} from 'react-router-dom';

import Layout from '/client/modules/common/components/layout';
import {portals} from '/lib/configs/portals';

class Page extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      collapsed: false
    };
  }

  componentDidUpdate() {
    this.onWindowResize();
  }

  componentDidMount() {
    window.addEventListener("resize", this.onWindowResize.bind(this));
    _.delay(() => $(window).trigger('resize'), 500);
  }

  onWindowResize() {
    try {
      const collapsedHeight = 800;
      const windowHeight = $(window).height();
      if (
        this.state.collapsed && windowHeight >= collapsedHeight ||
        !this.state.collapsed && windowHeight < collapsedHeight
      ) {
        this.setState({collapsed: windowHeight < collapsedHeight});
      }
    } catch(e) {}
  }

  render() {
    const {portal, fullWidth} = this.props;
    return (
      <Layout portal={portal} fullWidth={fullWidth}>
        { !this.state.collapsed && 
          <React.Fragment>
            <style>{`
              a, a:hover {
                color: ${portals[portal].rgb};
              }
            `}</style>
            <Link
              className={'ui menu basic button page-logo ' + portals[portal].color}
              to={portals[portal].url}
            >
              {portal.substring(0,1)}
            </Link>
            <Link to={portals[portal].url}>
              <h1 className="page-title">{portals[portal].title}</h1>
              <h4 className="page-subtitle">{portals[portal].subtitle}</h4>
            </Link>
            {!this.props.menu && <div className="ui divider"/>}
            {this.props.menu || undefined}
            {this.props.title && <h3>{this.props.title}</h3>}
          </React.Fragment>
        }
        {this.props.children}
      </Layout>
    )
  }

}

Page.propTypes = {
  portal:    PropTypes.oneOf(_.keys(portals)).isRequired,
  title:     PropTypes.string,
  fullWidth: PropTypes.bool,
  menu:      PropTypes.node
};

export default Page;
