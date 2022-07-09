import _ from  'lodash';
import React from 'react';
import queryString from 'query-string'
import {Route, Switch, Redirect} from 'react-router-dom';
import {Helmet} from 'react-helmet';

import {versions} from '/lib/configs/kdd/data_models.js';
import Page from '/client/modules/common/components/page';
import KdDHome from '/client/modules/kdd/components/home';

import KdDMenu from '/client/modules/kdd/components/menu/menu';
import KdDContact from '/client/modules/kdd/components/menu/contact';


import KdDSearch from '/client/modules/kdd/components/search';
import KdDUploadContribution from '/client/modules/kdd/components/upload_contribution';
import KdDPrivateContributions from '/client/modules/kdd/components/private_contributions';
import KdDDataModel from '/client/modules/kdd/components/data_model';
import { elements } from '/lib/configs/kdd/elements.js';

import KdDValidateContribution from '/client/modules/kdd/components/validate_contribution';
import Error from '/client/modules/common/components/error';

const Routes = ({match}) => (
  <Switch>

    {/* Static Pages */}
    <Route exact path="/KdD" render={() =>
      <Page portal="GERM" menu={<KdDMenu/>}>
        <Helmet><title>KdD Home | EarthRef.org</title></Helmet>
        <KdDHome/>
      </Page>
    }/>
    <Route exact path="/KdD/contact" render={() =>
      <Page portal="GERM" menu={<KdDMenu/>}>
        <Helmet><title>Contact KdD | EarthRef.org</title></Helmet>
        <KdDContact/>
      </Page>
    }/>

    {/* Search Interface */}
    <Route exact path="/KdD/search" render={({location}) => {
      let redirectTo;
      if (_.trim(location.hash) !== '') {
        try {
          let oldSearchState = JSON.parse(atob(location.hash.substr(1)));
          if (oldSearchState && oldSearchState.p && oldSearchState.p.length >= 0)
            redirectTo = {
              pathname: "/KdD/search", 
              state: {
                search: `doi:"${oldSearchState.p[0]}"`
              }
            };
        } catch(e) { console.error(e); }
      }
      if (!redirectTo && location.search && location.search.length > 1) {
        redirectTo = {
          pathname: "/KdD/search", 
          state: {
            search: location.search.substring(1)
          }
        };
      }
      return (redirectTo && <Redirect to={redirectTo}/> ||
        <Page fullWidth portal="GERM" menu={<KdDMenu/>}>
          <Helmet><title>KdD Search | EarthRef.org</title></Helmet>
          <KdDSearch search={location.state && location.state.search || ""}/>
        </Page>
      );
    }}/>
    <Route exact path="/KdD/:id(\d+)/:private_key([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})" render={({match, location}) =>
      <Redirect to={{
        pathname: "/KdD/search", 
        state: {
          search: `id:"${match.params.id}" private_key:"${match.params.private_key}" ` + location.search || ""
        }
      }}/>
    }/>
    <Route exact path="/KdD/:id(\d+)" render={({match, location}) =>
      <Redirect to={{
        pathname: "/KdD/search", 
        state: {
          search: `id:"${match.params.id}" ` + location.search || ""
        }
      }}/>
    }/>
    <Route exact path="/KdD/doi/:doi(.+)" render={({match, location}) =>
      <Redirect to={{
        pathname: "/KdD/search", 
        state: {
          search: `doi:"${match.params.doi}" ` + location.search || ""
        }
      }}/>
    }/>
    <Route exact path="/KdD/e::element(.+)" render={({match, location}) =>
      <Redirect to={{
        pathname: "/KdD/search", 
        state: {
          search: `element:"${elements.filter(x => x.number == match.params.element).length && elements.filter(x => x.number == match.params.element)[0].name}" ` + location.search || ""
        }
      }}/>
    }/>
    
    {/* Other Tools */}
    <Route exact path="/KdD/validate" render={() =>
      <Page portal="GERM" title="Validate a KdD contribution:" menu={<KdDMenu/>}>
        <Helmet>
          <title>KdD Validator | EarthRef.org</title>
        </Helmet>
        <KdDValidateContribution/>
      </Page>
    }/>

    <Route exact path="/KdD/upload" render={() =>
      <Page portal="GERM" title="Upload data into your private workspace:" menu={<KdDMenu/>}>
        <Helmet>
          <title>KdD Uploader | EarthRef.org</title>
        </Helmet>
        <KdDUploadContribution/>
      </Page>
    }/>

    <Route exact path="/KdD/private" render={({location}) =>
      <Page portal="GERM" title="Manage your contributions:" menu={<KdDMenu/>}>
        <Helmet>
          <title>KdD Private Workspace | EarthRef.org</title>
        </Helmet>
        <KdDPrivateContributions/>
      </Page>
    }/>

    <Redirect exact from="/KdD/data-models" to={`/KdD/data-models/${_.last(versions)}`}/>
    <Route exact path="/KdD/data-models/:v" render={({match, location}) => {
      if (window.history.replaceState)
        window.history.replaceState({}, 'KdD Data Models | EarthRef.org', '/KdD/data-models/' + match.params.v);    
      return (
        <Page portal="GERM" title="Browse the current and recent KdD Data Models:" menu={<KdDMenu/>}>
          <Helmet>
            <title>KdD Data Models | EarthRef.org</title>
          </Helmet>
          <KdDDataModel version={match.params.v} search={queryString.parse(location.search).q || ""}/>
        </Page>
      );
    }}/>
    
    {/* 404 Not Found */}
    <Route render={() =>
      <Page portal="GERM" menu={<KdDMenu/>}>
        <Helmet>
          <title>KdD Error | EarthRef.org</title>
        </Helmet>
        <Error title="Error 404: Sorry, this page is missing!"/>
      </Page>
    }/>
  </Switch>
);

export default Routes;
