import _ from 'lodash';
import moment from "moment";
import saveAs from 'save-as';
import jszip from 'jszip'; //import JSZip from 'xlsx-style/node_modules/jszip';
import XLSX from 'xlsx';
import React from 'react';
import Cookies from 'js-cookie';
import {Form, Checkbox, Progress} from 'semantic-ui-react';

import Count from '/client/modules/common/containers/search_count.jsx';
import ExportContribution from '/lib/modules/kdd/export_contribution.js';
import {versions} from '/lib/configs/kdd/data_models.js';
import {levels, index} from '/lib/configs/kdd/search_levels.js';

export default class extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      renderModal: false,
      downloadIDs: [],
      downloadContributions: false,
      downloadKds: true,
      progress: undefined,
      format: "text"
    };
    this.downloadedRows = [];
    this.canceled = true;
  }

  componentDidUpdate(lastprops, lastState) {
    if (!_.isEqual(this.props.queries, lastprops.queries) || !_.isEqual(this.props.filters, lastprops.filters)) {
      this.setState({progress: undefined, downloadIDs: []});
      this.downloadedRows = [];
      this.canceled = true;
    }

    if ((this.state.progress === undefined || this.state.progress === 100) && 
      !this.state.downloadContributions &&
      !this.state.downloadKds
    ) this.setState({downloadContributions: true});
  }

  handleContributionFilesCheckboxClick() {
    if (this.state.progress === undefined || this.state.progress === 100) this.setState({
      downloadContributions: true,
      downloadKds:           false
    });
  }

  handleLevelRowsCheckboxClick(level) {
    if (this.state.progress === undefined || this.state.progress === 100) this.setState({
      downloadContributions: false,
      ["download" + level]:  !this.state["download" + level]
    });
  }

  downloadContributionFiles() {
    this.setState({progress: 0, downloadIDs: []});
    this.canceled = false;
    Meteor.call('esContributionIDs', {index: index, queries: this.props.queries, filters: this.props.filters}, (error, result) => {
      if (error) {
        console.error('esContributionIDs', error);
      } else {
        console.log('contribution IDs', result);
        this.setState({progress: 100, downloadIDs: result});
      }
    });
  }

  downloadLevelRows() {
    this.setState({progress: 0});
    this.canceled = false;
    this.downloadedRows = {contribution: [{data_model_version: _.last(versions), description: `Downloaded from KdD at ${moment().utc().toISOString()}.`}]};
    let processedHits = 0;
    let processResults = (error, results) => {
      try {
        if (error) {
          console.error('SearchDownload', error);
        } else if (this.canceled) {
          this.setState({progress: undefined});
        } else {
          results.hits.hits.map(hit => {
            console.log('hit._source', hit._source)
            this.downloadedRows[hit._source.type] = this.downloadedRows[hit._source.type] || [];
            let reference, citation;
            try {reference = hit._source.summary.contribution.reference;} catch(e) {}
            try {citation = hit._source.summary.contribution._reference.citation;} catch(e) {}
            //if (hit._source.columns) console.log(_.zipObject(hit._source.columns, hit._source.rows[0]), hit._source.rows.map(row => _.zipObject(hit._source.columns, row)));
            //if (hit._source.columns)
            //  this.downloadedRows[hit._type].push(...hit._source.rows.map(row => _.zipObject(hit._source.columns, row)));
            //else
              this.downloadedRows[hit._source.type].push(...hit._source.rows.map(row => {
                if (row['citations'] && (reference || citation))
                  row['citations'] = row['citations'].replace(/this study/i, reference || citation)
                return row;
              }));
            processedHits++;
          });
          console.log('SearchDownload', processedHits, results.hits.total.value);
          this.setState({progress: Math.floor(100*processedHits/results.hits.total.value)});
          if (results.hits.total.value > processedHits)
            Meteor.call('esScrollByID', results._scroll_id, processResults);
          else if (this.state.format === "text") {
            const exporter = new ExportContribution({});
            const exportedRows = exporter.toText(this.downloadedRows);
            //console.log('exporter', exporter.errors(), exportedRows);
            let blob = new Blob([exportedRows], {type: "text/plain;charset=utf-8"});
            saveAs(blob, 'kdd_downloaded_rows.txt');
          } else {
            const exporter = new ExportContribution({});
            const workbook = exporter.toExcel(this.downloadedRows);
            // console.log('exporter', exporter.errors(), workbook);
            const workbookBinary = XLSX.write(workbook, {bookType:'xlsx', bookSST:true, type: 'binary'});
            const workbookBuffer = new ArrayBuffer(workbookBinary.length);
            const workbookEncoded = new Uint8Array(workbookBuffer);
            for (var i=0; i!=workbookBinary.length; ++i)
              workbookEncoded[i] = workbookBinary.charCodeAt(i) & 0xFF;
            const workbookBlob = new Blob([workbookBuffer], {type: 'application/octet-stream'});
            saveAs(workbookBlob, 'kdd_downloaded_rows.xlsx');
          }
        }
      } catch (error) {
        console.error(error);
        console.error('SearchDownload', error);
      }
    };

    Meteor.call('esScroll', { 
      index: index, 
      type: this.state.downloadContributions ? 'contribution' : 'kds', 
      queries: this.props.queries, 
      filters: this.props.filters,
      source: ['type',
      'rows',
      'summary.contribution._reference.citation',
      'summary.contribution.reference']
    }, 500, processResults);
  }

  render() {
    return (
      <div ref="download button" className={this.props.className} style={this.props.style}
        onClick={(e) => { 
          if (e.target === this.refs["download button"]) 
            this.setState({renderModal: true}, () => 
              $(this.refs['download modal']).modal('show')
            )
        }}
      >
        {this.props.children}
        { this.state.renderModal && <div ref="download modal" className="ui modal">
          <div className="ui icon header">
          <i className="download icon"></i>
          Download Results
          </div>
          <div className="content">
            <table style={{margin: "auto"}}>
              <tbody>
                <tr>
                  <td>
                    <Checkbox
                      onChange={this.handleContributionFilesCheckboxClick.bind(this)}
                      checked={this.state.downloadContributions}
                    />
                  </td>
                  <td style={{cursor: "pointer", fontWeight: this.state.downloadContributions ? "bold" : "normal", textAlign: "right"}}
                    onClick={this.handleContributionFilesCheckboxClick.bind(this)}
                  >
                    <Count
                      es={{ 
                        index: index, 
                        type: 'contribution', 
                        queries: this.props.queries, 
                        filters: this.props.filters
                      }}
                    />
                  </td>
                  <td style={{cursor: "pointer", fontWeight: this.state.downloadContributions ? "bold" : "normal"}}
                    onClick={this.handleContributionFilesCheckboxClick.bind(this)}
                  >
                    <Count
                      es={{ 
                        index: index, 
                        type: 'contribution', 
                        queries: this.props.queries, 
                        filters: this.props.filters
                      }}
                      noNumeral={true}
                      singular="Contribution File"
                      plural="Contribution Files"
                    />
                    &nbsp;(including all tables)
                  </td>
                </tr>
                <tr>
                  <td colSpan="3">
                  <div className="ui horizontal divider" style={{width: '100%'}}>or</div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <Checkbox
                      onChange={() => this.handleLevelRowsCheckboxClick("Kds")}
                      checked={this.state.downloadKds}
                    />
                  </td>
                  <td style={{cursor: "pointer", fontWeight: this.state.downloadKds ? "bold" : "normal", textAlign: "right"}}
                    onClick={() => this.handleLevelRowsCheckboxClick("Kds")}
                  >
                    <Count
                      es={{ 
                        index: index, 
                        type: 'kds',
                        queries: this.props.queries, 
                        filters: this.props.filters
                      }}
                    />
                  </td>
                  <td style={{cursor: "pointer", fontWeight: this.state.downloadKds ? "bold" : "normal"}}
                    onClick={() => this.handleLevelRowsCheckboxClick("Kds")}
                  >
                    <Count
                      es={{ 
                        index: index, 
                        type: 'kds',
                        queries: this.props.queries, 
                        filters: this.props.filters
                      }}
                      noNumeral={true}
                      singular="Kd Row"
                      plural="Kd Rows"
                    />
                  </td>
                </tr>
                <tr>
                  <td colSpan="3">
                    <div className="ui divider" style={{width: '100%'}}></div>
                  </td>
                </tr>
                <tr>
                  <td colSpan="3">
                    <Checkbox type="radio" name="format" value="text" label="KdD Text File"
                      disabled={this.state.downloadContributions}
                      checked={!this.state.downloadContributions && this.state.format === "text"} 
                      onChange={(e, {value}) => this.setState({format: value})}
                    />
                  </td>
                </tr>
                <tr>
                  <td colSpan="3">
                    <Checkbox type="radio" name="format" value="excel" label="Excel Spreadsheet"
                      disabled={this.state.downloadContributions}
                      checked={!this.state.downloadContributions && this.state.format === "excel"} 
                      onChange={(e, {value}) => this.setState({format: value})}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="ui divider" style={{width: '100%'}}></div>
            <p>
              Note, this may take several minutes to prepare and initiate the download. The file
              will appear in your browser's download folder.
            </p>
            { this.state.progress !== undefined &&
              <Progress percent={this.state.progress} color="orange" progress autoSuccess active={this.state.progress < 100}
                style={{margin:0}}
              />
            }
          </div>
          <div className="actions">
          { this.state.downloadContributions && (this.state.progress === undefined || this.state.progress === 100) &&
              <div className="ui button orange" onClick={this.downloadContributionFiles.bind(this)}>
                Prepare Files
              </div>
            }
            { this.state.downloadContributions && (this.state.downloadIDs.length > 0 && this.state.progress === 100) &&
              <button type="submit" className="ui button orange" onClick={function (e) {
                Meteor.call('kddGetPublicContributions', this.state.downloadIDs, 'kdd_search_results.zip', '@' + Cookies.get('user_id', Meteor.isDevelopment ? {} : { domain: '.earthref.org'}), function (error, source) {
                  if (source) {
                    let blob = new Blob([source], {type: "application/zip"});
                    saveAs(blob, 'kdd_search_results.zip');
                  } else {
                    console.error(error);
                    alert('Failed to find the contribution for download. Please try again soon or email KdD using the link at the bottom of this page.');
                  }
                }.bind(this));
              }.bind(this)}>
                Download Files
              </button>
            }
            { !this.state.downloadContributions && (this.state.progress === undefined || this.state.progress === 100) &&
              <div className="ui button orange" onClick={this.downloadLevelRows.bind(this)}>
                Download Rows
              </div>
            }
            { this.state.progress !== undefined && this.state.progress < 100 && 
              <div className="ui button red" onClick={() => this.canceled = true}>
                Cancel Download
              </div>
            }
            <div className="ui deny button">
              Close
            </div>
          </div>
        </div> }
      </div>
    );
  }

}