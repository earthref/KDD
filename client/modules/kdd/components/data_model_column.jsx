import _ from  'lodash';
import React from 'react';
import {Link} from 'react-router-dom';
import {versions, models} from '/lib/configs/kdd/data_models';
import {cvs} from '/lib/modules/er/controlled_vocabularies';
import {svs} from '/lib/modules/er/suggested_vocabularies';
import {codes} from '/lib/configs/kdd/method_codes';

export default class extends React.Component {

  constructor(props) {
    super(props);
    this.reValidationParam = /\("(.+?)"\)/;
  }

  formatValidation(validation) {
    let matches;
    if (validation === 'required()') {
      return (
        <span>
          <div className="ui red horizontal small label">Required</div>
          The values in this column must not be empty.
        </span>
      );
    }
    else if (validation === 'recommended()') {
      return (
        <span>
          <div className="ui yellow horizontal small label">Recommended</div>
          The values in this column are recommended not to be empty.
        </span>
      );
    }
    else if (validation === 'downloadOnly()') {
      return (
        <span>
          <div className="ui black horizontal small label">Download Only</div>
          The value in this column is included in downloaded contributions,
          but is ignored in uploaded contributions.
        </span>
      );
    }
    else if (validation.substr(0,4) === 'in("') {
      const column = validation.substr(4,validation.length-6);
      return (
        <span>
          <div className="ui teal horizontal small label">Found In</div>
          The values in this column must contain a value found in the contribution's <a href={'?q=' + column}>
            {column}
          </a> column.
        </span>
      );
    }
    else if (validation.substr(0,4) === 'min(') {
      const min = validation.substr(4,validation.length-5);
      return (
        <span>
          <div className="ui purple horizontal small label">Validation</div>
          The values in this column must contain a value greater than or equal to {min}.
        </span>
      );
    }
    else if (validation.substr(0,4) === 'max(') {
      const max = validation.substr(4,validation.length-5);
      return (
        <span>
          <div className="ui purple horizontal small label">Validation</div>
          The values in this column must contain a value less than or equal to {max}.
        </span>
      );
    }
    else if (validation.substr(0,21) === 'requiredUnlessTable("') {
      const table = validation.substr(21,validation.length-23);
      return (
        <span>
          <div className="ui green horizontal small label">Required (?)</div>
          The values in this column must not be empty unless the contribution
          includes rows in the  <a href={'?q=' + table + '.'}>
          {table}
        </a> table.
        </span>
      );
    }
    else if (validation.substr(0,12) === 'requiredIf("') {
      const column = validation.substr(12,validation.length-14);
      return (
        <span>
          <div className="ui green horizontal small label">Required (?)</div>
          For each row, the value in this column must not be empty if the <a href={'?q=' + column + '.'}>
          {column}
        </a> column value is not empty.
        </span>
      );
    }
    else if (validation.substr(0,16) === 'requiredUnless("') {
      const columns = validation.substr(16,validation.length-18).split('","');
      return (
        <span>
          <div className="ui green horizontal small label">Required (?)</div>
          For each row, the value in this column must not be empty unless the {(columns.map((c, i) => {
            return (
              <span key={i}>
                {(i > 0 ? ' or ' : '')}
                <a href={'?q=' + c}>
                  {c}
                </a>
              </span>
            );
          }))} column value{columns.length > 1 ? 's are' : ' is'} not empty.
        </span>
      );
    }
    else if (validation.substr(0,17) === 'requiredIfGroup("') {
      const groups = validation.substr(17,validation.length-19).split('","');
      return (
        <span>
          <div className="ui green horizontal small label">Required (?)</div>
          For each row, the value in this column must not be empty if one of the column values in the {(groups.map((g, i) => {
            return (
              <span key={i}>
                {(i > 0 ? ' or ' : '')}
                <a href={'?q=' + g}>
                  {g} Group
                </a>
              </span>
            );
          }))} of this table is not empty.
        </span>
      );
    }
    else if (validation.substr(0,20) === 'requiredOneInGroup("') {
      const groups = validation.substr(20,validation.length-22).split('","');
      return (
        <span>
          <div className="ui green horizontal small label">Required (?)</div>
          For each row, the value in this column must not be empty unless one of the column values in the {(groups.map((g, i) => {
            return (
              <span key={i}>
                {(i > 0 ? ' or ' : '')}
                <a href={'?q=' + g}>
                  {g} Group
                </a>
              </span>
            );
          }))} of this table is not empty.
        </span>
      );
    }
    else if (validation === 'requiredUnlessSynthetic()') {
      return (
        <span>
          <div className="ui green horizontal small label">Required (?)</div>
          For each row, the value in this column must not be empty unless the
          contribution is being validated as a sythentic samples study.
        </span>
      );
    }
    else if (validation === 'type("users")') {
      return (
        <span>
          <div className="ui purple horizontal small label">Validation</div>
          Any values in this column could contain a user's ORCID iD or an EarthRef.org 
          user's handle. If neither are known, the column value should include the user's 
          email address and the they will be contacted when the contribution is made public.
        </span>
      );
    }
    else if (validation === 'type("url")') {
      return (
        <span>
          <div className="ui purple horizontal small label">Validation</div>
          Any values in this column must contain a valid URL.
        </span>
      );
    }
    else if (validation === 'type("igsn")') {
      return (
        <span>
          <div className="ui purple horizontal small label">Validation</div>
          Any values in this column must contain a
          valid <a href="http://www.geosamples.org/aboutigsn">International Geo Sample Number</a>.
        </span>
      );
    }
    else if (validation === 'type("date_time")') {
      return (
        <span>
          <div className="ui purple horizontal small label">Validation</div>
          Any values in this column must contain a valid date and time between 1900 and today.
        </span>
      );
    }
    else if (validation === 'type("references")') {
      return (
        <span>
            <div className="ui purple horizontal small label">Validation</div>
            Any values in this column shoud either contain valid DOI that is resolvable by 
            doi.org or a valid URL that resolves to a web page. If you have
            a dataset associated with a paper that does not have a DOI (PhD thesis,
            master thesis, USGS report, etc.), MagIC can store the paper in the ERDA
            database (barring copyright issues) and mint a DOI for it.
        </span>
      );
    }
    else if (validation === 'type("method_codes")') {
      return (
        <span>
          <div className="ui orange horizontal small label">Vocabulary</div>
          Any values in this column must contain a value found
          in the <Link to={'/KdD/method-codes'}>Method Codes</Link> controlled vocabulary.
        </span>
      );
    }
    else if (validation.substr(0,4) === 'cv("') {
      const cv = validation.substr(4,validation.length-6);
      let cv_label = cv;
      if (cvs[cv] && cvs[cv].label) cv_label = cvs[cv].label;
      else console.error(`cvs[${cv}].label is not defined.`);
      return (
        <span>
          <div className="ui orange horizontal small label">Vocabulary</div>
          Any values in this column must contain a value found
          in the <Link to={'/vocabularies/controlled/?q=' + encodeURI(cv)}>
            {cv_label}
          </Link> controlled vocabulary.
        </span>
      );
    }
    else if (validation.substr(0,4) === 'sv("') {
      const sv = validation.substr(4,validation.length-6);
      let sv_label = sv;
      if (svs[sv] && svs[sv].label) sv_label = svs[sv].label;
      else console.error(`svs[${sv}].label is not defined.`);
      return (
        <span>
          <div className="ui orange horizontal small label">Vocabulary</div>
          Any values in this column could contain a value found
          in the <Link to={'/vocabularies/suggested/?q=' + encodeURI(sv)}>
            {sv_label}
          </Link> suggested vocabulary. If not, the value will be added to the
          suggested vocabulary when the contribution is made public.
        </span>
      );
    }
    return validation;
  }

  formatTypeUnit(type, unit) {
    if (!unit || unit === 'Custom' || unit === 'Dimensionless')
      return type;
    if (unit === 'Flag')
      return unit;
    return type + (unit ? ' in ' + unit : unit);
  }

  formatVocabulariesSample(vocabulary) {
    return _.map(_.sampleSize(vocabulary.items, 5), (item) => {
      if (item.label)
        return (
          <span>
            <b>{item.item}</b>
            <span className="vocabulary-label"> = {item.label}</span>
          </span>
        );
      else
        return item.item;
    });
  }

  render() {
    const {version, table, column} = this.props;
    const model = models[version].tables[table].columns[column];

    let validations = model.validations;
    const user_validation = _.find(validations, (x) => { return x === 'type("users")'; });
    const mc_validation   = _.find(validations, (x) => { return x === 'type("method_codes")'; });
    const ref_validation  = _.find(validations, (x) => { return x === 'type("references")'; });
    const cv_validation   = _.find(validations, (x) => { return x.substr(0,4) === 'cv("'; });
    const sv_validation   = _.find(validations, (x) => { return x.substr(0,4) === 'sv("'; });
    const key = _.some(validations, (x) => {
      return x === 'key()';
    });
    const required = _.some(validations, (x) => {
      return x === 'required()';
    });
    const requiredConditionally = _.some(validations, (x) => {
      return x != 'required()' && x.substr(0,8) === 'required';
    });
    const downloadOnly = _.some(validations, (x) => {
      return x === 'downloadOnly()';
    });
    const foundIn = _.some(validations, (x) => {
      return x.substr(0,4) === 'in("';
    });
    const range = _.some(validations, (x) => {
      return x.substr(0,4) === 'min(' || x.substr(0,4) === 'max(';
    });
    const recommended = _.some(validations, (x) => {
      return x === 'recommended()';
    });
    const type = (_.some(validations, (x) => {
      return x.substr(0,6) === 'type("';
    }) && !mc_validation && !ref_validation && !user_validation);

    let examples = model.examples;
    if (!examples && cv_validation) {
      const reMatches = this.reValidationParam.exec(cv_validation);
      if (reMatches.length >= 2 && cvs[reMatches[1]])
        examples = this.formatVocabulariesSample(cvs[reMatches[1]]);
      else
        console.error(`Failed to use ${cv_validation} to populate examples`);
    } else if (!examples && sv_validation) {
      const reMatches = this.reValidationParam.exec(sv_validation);
      if (reMatches.length >= 2 && svs[reMatches[1]])
        examples = this.formatVocabulariesSample(svs[reMatches[1]]);
      else
        console.error(`Failed to use ${sv_validation} to populate examples`);
    }

    let previous = model.previous_columns;

    let previous_version;
    if (_.indexOf(versions, version) > 0)
      previous_version = versions[_.indexOf(versions, version)-1];

    return (
      <div>
        <div className="title">
          <i className="dropdown icon"/>
          <span>
            {models[version].tables[table].position}.{model.position}
          </span>
          <span>
            {model.label}
            <span className="column">, {column}</span>
          </span>
          <span className="ui basic horizontal small label">
            {this.formatTypeUnit(model.type, model.unit)}
          </span>
          <span className="description">{model.description}</span>
          {(requiredConditionally && !required ?
            <div className="ui green horizontal small label">Required (?)</div> : undefined)}
          {(required || key ?
            <div className="ui red horizontal small label">Required</div> : undefined)}
          {(recommended ?
            <div className="ui yellow horizontal small label">Recommended</div> : undefined)}
          {(downloadOnly ?
            <div className="ui black horizontal small label">Download Only</div> : undefined)}
          {(type || range || ref_validation || user_validation ?
            <div className="ui purple horizontal small label">Validation</div> : undefined)}
          {(cv_validation || mc_validation || sv_validation ?
            <div className="ui orange horizontal small label">Vocabulary</div> : undefined)}
          {(foundIn ?
            <div className="ui teal horizontal small label">Found In</div> : undefined)}
        </div>
        <div className="content">
          <table className="ui very basic small compact table"><tbody>
            {(model.description ?
              <tr>
                <td className="top aligned collapsing"><b>Description:</b></td>
                <td>{model.description}</td>
              </tr> : undefined)}
            {(model.notes ?
              <tr>
                <td className="top aligned collapsing"><b>Notes:</b></td>
                <td>{model.notes}</td>
              </tr> : undefined)}
            {(model.type ?
              <tr>
                <td className="top aligned collapsing"><b>Type:</b></td>
                <td>{model.type}</td>
              </tr> : undefined)}
            {(model.unit ?
              <tr>
                <td className="top aligned collapsing"><b>Unit:</b></td>
                <td>{model.unit}</td>
              </tr> : undefined)}
            {(model.urls ?
              <tr>
                <td className="top aligned collapsing">
                  <b>
                    {'Link' + (model.urls.length > 1 ? 's' : '')}:
                  </b>
                </td>
                <td>
                  {model.urls.map((x,l) => {
                    return (
                      <span key={l}>
                        {(l > 0 ? <br/> : undefined)}
                        <a href={x} target="_blank">{x}</a>
                      </span>
                    );
                  })}
                </td>
              </tr> : undefined)}
            {(examples ?
              <tr>
                <td className="top aligned collapsing">
                  <b>
                    {'Example' + (examples.length > 1 ? 's' : '')}:
                  </b>
                </td>
                <td>
                  {examples.map((x,l) => {
                    return (
                      <span key={l}>
                        {(l > 0 ? <br/> : undefined)}
                        {x}
                      </span>
                    );
                  })}
                </td>
              </tr> : undefined)}
            {(validations ?
              <tr>
                <td className="top aligned collapsing">
                  <b>
                    {'Validation' + (validations.length > 1 ? 's' : '')}:
                  </b>
                </td>
                <td>
                  {validations.map((x,l) => {
                    return (
                      <span key={l}>
                        {(l > 0 ? <br/> : undefined)}
                        {this.formatValidation(x)}
                      </span>
                    );
                  })}
                </td>
              </tr> : undefined)}
            <tr>
              <td className="top aligned collapsing">
                <b>{version} Column:</b>
              </td>
              <td>
                {table}.{column}
              </td>
            </tr>
            {(previous_version && previous ?
              <tr>
                <td className="top aligned collapsing">
                  <b>
                    {previous_version + ' Column' + (previous.length > 1 ? 's' : '')}:
                  </b>
                </td>
                <td>
                  {previous.map((x,l) => {
                    return (
                      <span key={l}>
                        {(l > 0 ? <br/> : undefined)}
                        <Link to={'/KdD/data-models/' + previous_version + '/?q=' + x.table + '.' + x.column}>
                          {x.table}.{x.column}
                        </Link>
                      </span>
                    );
                  })}
                </td>
              </tr> : undefined)}
          </tbody></table>
        </div>
      </div>
    );
  }

}

