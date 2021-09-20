import _ from  'lodash';
import React from 'react';
import queryString from 'query-string'
import {Route, Switch, Redirect} from 'react-router-dom';
import {Helmet} from 'react-helmet';

import {versions} from '/lib/configs/kdd/data_models.js';
import Page from '/client/modules/common/components/page';
import KdDHome from '/client/modules/kdd/components/home';

import KdDMenu from '/client/modules/kdd/components/menu/menu';
import KdDAbout from '/client/modules/kdd/components/menu/about';
import KdDTechnology from '/client/modules/kdd/components/menu/technology';
import KdDContact from '/client/modules/kdd/components/menu/contact';
import KdDWorkshops from '/client/modules/kdd/components/menu/workshops';
import KdDLinks from '/client/modules/kdd/components/menu/links';
import KdDJupyterNotebooks from '/client/modules/kdd/components/menu/jupyter_notebooks';
import KdDGrandChallenges from '/client/modules/kdd/components/menu/grand_challenges';

import KdDHelp from '/client/modules/kdd/components/menu/help/help';
import KdDHelpTextFileFormat from '/client/modules/kdd/components/menu/help/text_file_format';
import KdDHelpUploadingData from '/client/modules/kdd/components/menu/help/uploading_data';
import KdDHelpCreateAccount from '/client/modules/kdd/components/menu/help/create_account';

import KdDMagNetZ from '/client/modules/kdd/components/magnetz';

import KdDSearch from '/client/modules/kdd/components/search';
import KdDUpgradeContribution from '/client/modules/kdd/components/upgrade_contribution';
import KdDUploadContribution from '/client/modules/kdd/components/upload_contribution';
import KdDPrivateContributions from '/client/modules/kdd/components/private_contributions';
import KdDDataModel from '/client/modules/kdd/components/data_model';
import KdDMethodCodes from '/client/modules/kdd/components/method_codes';

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
    <Route exact path="/KdD/about" render={() =>
      <Page portal="GERM" menu={<KdDMenu/>}>
        <Helmet><title>About KdD | EarthRef.org</title></Helmet>
        <KdDAbout/>
      </Page>
    }/>
    <Route exact path="/KdD/technology" render={() =>
      <Page portal="GERM" menu={<KdDMenu/>}>
        <Helmet><title>KdD Technology | EarthRef.org</title></Helmet>
        <KdDTechnology/>
      </Page>
    }/>
    <Route exact path="/KdD/contact" render={() =>
      <Page portal="GERM" menu={<KdDMenu/>}>
        <Helmet><title>Contact KdD | EarthRef.org</title></Helmet>
        <KdDContact/>
      </Page>
    }/>
    <Route exact path="/KdD/help" render={() =>
      <Page portal="GERM" title="KdD Help" menu={<KdDMenu/>}>
        <Helmet><title>KdD Help | EarthRef.org</title></Helmet>
        <KdDHelp/>
      </Page>
    }/>
    <Route exact path="/KdD/help/text-file-format" render={() =>
      <Page portal="GERM" title="The KdD Text File Format" menu={<KdDMenu/>}>
        <Helmet><title>KdD Help - KdD Text File Format</title></Helmet>
        <KdDHelpTextFileFormat/>
      </Page>
    }/>
    <Route exact path="/KdD/help/uploading-data" render={() =>
      <Page portal="GERM" title="Uploading Data to KdD" menu={<KdDMenu/>}>
        <Helmet><title>KdD Help - Uploading Data into KdD</title></Helmet>
        <KdDHelpUploadingData/>
      </Page>
    }/>
    <Route exact path="/KdD/help/create-account" render={() =>
      <Page portal="GERM" title="Creating a KdD Account" menu={<KdDMenu/>}>
        <Helmet><title>KdD Help - Creating a KdD Account</title></Helmet>
        <KdDHelpCreateAccount/>
      </Page>
    }/>
    <Route exact path="/KdD/workshops" render={() =>
      <Page portal="GERM" title="KdD Workshops" menu={<KdDMenu/>}>
        <Helmet><title>KdD Workshops | EarthRef.org</title></Helmet>
        <KdDWorkshops/>
      </Page>
    }/>
    <Route exact path="/KdD/links" render={() =>
      <Page portal="GERM" title="Links to Outside Resources" menu={<KdDMenu/>}>
        <Helmet><title>Links to Outside Resources | EarthRef.org</title></Helmet>
         <KdDLinks/>
      </Page>
    }/>
    <Route exact path="/KdD/jupyter-notebooks" render={({location}) =>
      <Page portal="GERM" title="Jupyter Notebooks" menu={<KdDMenu/>}>
        <Helmet><title>Jupyter Notebooks | EarthRef.org</title></Helmet>
        <KdDJupyterNotebooks/>
      </Page>
    }/>
    <Route exact path="/KdD/grand-challenges" render={({location}) =>
      <Page portal="GERM" title="The KdD Grand Challenges" menu={<KdDMenu/>}>
        <Helmet><title>KdD Grand Challenges | EarthRef.org</title></Helmet>
        <KdDGrandChallenges/>
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
    
    {/* Other Tools */}
    <Route exact path="/KdD/validate" render={() =>
      <Page portal="GERM" title="Validate a KdD contribution:" menu={<KdDMenu/>}>
        <Helmet>
          <title>KdD Validator | EarthRef.org</title>
        </Helmet>
        <KdDValidateContribution/>
      </Page>
    }/>

    <Route exact path="/KdD/upgrade" render={() =>
      <Page portal="GERM" title="Upgrade an outdated KdD contribution to the latest KdD data model version:" menu={<KdDMenu/>}>
        <Helmet>
          <title>KdD Upgrader | EarthRef.org</title>
        </Helmet>
        <KdDUpgradeContribution/>
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

    <Route exact path="/KdD/method-codes" render={({location}) =>{
      if (window.history.replaceState)
        window.history.replaceState({}, 'KdD Method Codes | EarthRef.org', '/KdD/method-codes');    
      return (
        <Page portal="GERM" title="Browse the KdD Method Codes:" menu={<KdDMenu/>}>
          <Helmet>
            <title>KdD Method Codes | EarthRef.org</title>
          </Helmet>
          <KdDMethodCodes search={queryString.parse(location.search).q || ""}/>
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
