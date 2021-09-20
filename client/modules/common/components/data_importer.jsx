import _ from 'lodash';
import moment from 'moment';
import React from 'react';
import PropTypes from 'prop-types';
import Cookies from 'js-cookie';
import {Tracker}  from 'meteor/tracker';

import FixedTable from '/client/modules/common/components/fixed_table';
import {portals} from '/lib/configs/portals';

export default class DataImporter extends React.Component {

  constructor(props) {
    super(props);
    this.initialState = {
      isLoaded: false,
      hasChanged: false,
      nRows: 0,
      minDataRows: 6,
      maxDataRows: 6,
      in: [],
      inColumnNames: [],
      loadedColumnMenu: {},
      excludeRowIdxs: [],
      errors: {
        data: [],
        nHeaderRows: [],
        tableName: [],
        columnNames: []
      },
      templatesReady: false,
      templateID: undefined,
      templateName: undefined,
      excludeColumnIdxs: props.excludeColumnIdxs || [],
      outColumnNames:    props.outColumnNames || [],
      settings: {
        tableName:   props.tableName || '',
        nHeaderRows: props.nHeaderRows || this.guessHeaderRows(props.data, props.dataModel && props.dataModel.tables || {}),
        columnMap: {},
        excludeColumnNames: [],
        excludeTable: false
      },
      importTemplatesTaps: 0,
      creatingTemplate: false,
      savingTemplate: false,
      deletingTemplate: false,
      renamingTemplate: false
    };
    this.state = this.initialState;
    this.importTemplates = [];
  }

  componentDidMount() {
    $(this.refs['table name dropdown']).dropdown({
      onChange: (tableName) => {
        let settings = this.state.settings;
        settings.tableName = tableName;
        _.delay(() => this.setState({settings: settings}));
      }
    });
    if (this.props.tableName)
      $(this.refs['table name dropdown']).dropdown('set selected', _.trim(this.props.tableName));
    this.setState({in: (!Array.isArray(this.props.data) ? [] : this.props.data)});
    $(this.refs['import settings template dropdown']).dropdown({
      onShow: ($modal) => {
        if (!this.state.templatesReady)
          Meteor.call('getImportSettingsTemplates', '@' + Cookies.get('user_id'), (error, templates) => {
            this.importTemplates = templates;
            this.setState({
              templatesReady: true,
              importTemplatesTaps: this.state.importTemplateTaps + 1
            });
          });
      },
      onChange: (value, text, $choice) => {
        if (value === '') {
          this.setState({
            isLoaded: false,
            hasChanged: false,
            templateID: undefined,
            templateName: undefined,
            excludeColumnIdxs: [],
            settings: {
              tableName: '',
              nHeaderRows: this.guessHeaderRows(this.props.data, this.props.dataModel && this.props.dataModel.tables || {}),
              columnMap: {},
              excludeColumnNames: [],
              excludeTable: false
            },
            outColumnNames: []
          });
          $(this.refs['table column headers']).find('.ui-checkbox').checkbox("set checked");
          $(this.refs['import settings template dropdown']).dropdown('restore placeholder text');
          $(this.refs['table name dropdown']).dropdown('restore placeholder text');
        } else {
          Meteor.call('getImportSettingsTemplate', value, (error, template) => {
            if (template && template.settings) {
              let outColumnNames = this.state.inColumnNames.map((inColumnName, i) => {
                return template.settings.columnMap[inColumnName];
              });
              $(this.refs['table column headers']).find('.ui-checkbox').checkbox("set checked");
              let excludeColumnIdxs = [];
              if (template.settings.excludeColumnNames)
                template.settings.excludeColumnNames.forEach((inColumnName) => {
                  let idx = this.state.inColumnNames.indexOf(inColumnName);
                  if (idx >= 0) {
                    excludeColumnIdxs.push(idx);
                    $(this.refs['table column headers']).find('.ui-checkbox[data-column-idx="' + idx + '"]').checkbox("set unchecked");
                  }
                });
              $(this.refs['table name dropdown']).dropdown('set selected', template.settings.tableName);
              this.setState({
                isLoaded: false,
                hasChanged: false,
                templateID: template._id,
                templateName: template._name,
                excludeColumnIdxs: excludeColumnIdxs,
                settings: template.settings,
                outColumnNames: outColumnNames
              });
            }
          });
        }
      }
    });
    $(this.refs['create import settings template']).modal({
      onApprove: ($modal) => {
        const templateName = this.refs['create import settings template name'].value;
        Meteor.call('createImportSettingsTemplate',
          '@' + Cookies.get('user_id', Meteor.isDevelopment ? {} : { domain: '.earthref.org'}),
          templateName,
          this.state.settings,
          (error, templateID) => {
            if (error) console.error('create import settings template', templateID, templateName, error);
            Meteor.call('getImportSettingsTemplates', '@' + Cookies.get('user_id', Meteor.isDevelopment ? {} : { domain: '.earthref.org'}), (error, templates) => {
              this.importTemplates = templates;
              this.setState({
                creatingTemplate: false,
                templatesReady: true,
                hasChanged: false,
                importTemplatesTaps: this.state.importTemplateTaps + 1,
                templateID: templateID, templateName: templateName
              });
              $(this.refs['create import settings template']).modal("hide");
            });
          }
        );
        this.setState({creatingTemplate: true, templatesReady: false});
        return false;
      }
    });
    $(this.refs['save import settings template']).modal({
      onApprove: ($modal) => {
        localStorage.removeItem('Import Templates');
        Meteor.call('saveImportSettingsTemplate',
          '@' + Cookies.get('user_id', Meteor.isDevelopment ? {} : { domain: '.earthref.org'}),
          this.state.templateID,
          this.state.settings,
          (error) => {
            if (error) console.error('saved import settings template', error);
            Meteor.call('getImportSettingsTemplates', '@' + Cookies.get('user_id', Meteor.isDevelopment ? {} : { domain: '.earthref.org'}), (error, templates) => {
              this.importTemplates = templates;
              this.setState({
                savingTemplate: false,
                templatesReady: true,
                hasChanged: false,
                importTemplatesTaps: this.state.importTemplateTaps + 1,
              });
              $(this.refs['save import settings template']).modal("hide");
            });
          }
        );
        this.setState({savingTemplate: true, templatesReady: false});
        return false;
      }
    });
    $(this.refs['delete import settings template']).modal({
      onApprove: ($modal) => {
        const templateID = this.refs['delete import settings template ID'].value;
        localStorage.removeItem('Import Templates');
        Meteor.call('deleteImportSettingsTemplate',
          '@' + Cookies.get('user_id', Meteor.isDevelopment ? {} : { domain: '.earthref.org'}),
          templateID,
          (error) => {
            if (error) console.error('delete import settings template', error);
            Meteor.call('getImportSettingsTemplates', '@' + Cookies.get('user_id', Meteor.isDevelopment ? {} : { domain: '.earthref.org'}), (error, templates) => {
              this.importTemplates = templates;
              if (templateID === this.state.templateID)
                this.setState({templateID: undefined, templateName: undefined});
              this.setState({
                deletingTemplate: false,
                templatesReady: true,
                importTemplatesTaps: this.state.importTemplateTaps + 1,
              });
              $(this.refs['delete import settings template']).modal("hide");
            });
          }
        );
        this.setState({deletingTemplate: true, templatesReady: false});
        return false;
      }
    });
    $(this.refs['rename import settings template']).modal({
      onApprove: ($modal) => {
        const templateName = this.refs['rename import settings template name'].value;
        const templateID = this.refs['rename import settings template ID'].value;
        localStorage.removeItem('Import Templates');
        Meteor.call('renameImportSettingsTemplate',
          '@' + Cookies.get('user_id'),
          templateID,
          templateName,
          (error) => {
            if (error) console.error('rename import settings template', templateID, this.state.templateID, templateName, this.refs['rename import settings template name'].value, error);
            Meteor.call('getImportSettingsTemplates', '@' + Cookies.get('user_id', Meteor.isDevelopment ? {} : { domain: '.earthref.org'}), (error, templates) => {
              this.importTemplates = templates;
              if (templateID === this.state.templateID)
                this.setState({templateName: this.refs['rename import settings template name'].value});
              this.setState({
                renamingTemplate: false,
                templatesReady: true,
                importTemplatesTaps: this.state.importTemplateTaps + 1,
              });
              $(this.refs['rename import settings template']).modal("hide");
            });
          }
        );
        this.setState({renamingTemplate: true, templatesReady: false});
        return false;
      }
    });
  }

  componentWillUpdate(nextProps, nextState) {
    let newState = _.cloneDeep(nextState);
    newState.isLoaded = true;

    // Copy the props data to the state input data.
    newState.in = (!Array.isArray(nextProps.data) ? [] : nextProps.data);
    //console.log('in', nextProps.data, nextState.in, newState.in);

    // Validate the number of header rows.
    const nHeaderRows = newState.settings.nHeaderRows;
    newState.errors.nHeaderRows = [];
    if (nHeaderRows !== '' && isNaN(nHeaderRows))
      newState.errors.nHeaderRows.push('"Number of Header Rows" must be empty (for no header) or numeric.');
    else if (nHeaderRows !== '' && nHeaderRows !== String(Number.parseInt(nHeaderRows)))
      newState.errors.nHeaderRows.push('"Number of Header Rows" must be empty (for no header) or an integer.');
    else if (nHeaderRows !== '' && Number.parseInt(nHeaderRows) < 0)
      newState.errors.nHeaderRows.push('"Number of Header Rows" must be empty (for no header) or greater than or equal to 0.');
    else if (nHeaderRows !== '' && Number.parseInt(nHeaderRows) > newState.in.length && newState.in.length > 0)
      newState.errors.nHeaderRows.push('"Number of Header Rows" must be empty (for no header) or less than or equal to ' + newState.in.length + ' (the number of rows in the dataset).');
    newState.nHeaderRowsInt = Math.max(0, (nHeaderRows === '' ? 0 : Number.parseInt(nHeaderRows)) || 0);

    // Validate the table name.
    newState.errors.tableName = [];
    newState.settings.tableName = _.trim(String(newState.settings.tableName));
    if (newState.settings.tableName === '')
      newState.errors.tableName.push('"Table Name" must be selected.');
    else if (_.indexOf(_.keys(this.props.dataModel.tables), newState.settings.tableName) === -1)
      newState.errors.tableName.push('Table name "' + newState.settings.tableName + '" is not recognized.');

    // Update the input column names list.
    const nColumns = _.reduce(newState.in, (maxColumns, row, rowIdx) =>
      Math.max(rowIdx >= newState.nHeaderRowsInt && row && row.length || 0, maxColumns), 0);
    newState.inColumnNames = _.map(_.range(nColumns), (x) => 'Column ' + (x+1));
    if (newState.nHeaderRowsInt > 0 && newState.errors.nHeaderRows.length === 0) {
      const columnNames = newState.in[newState.nHeaderRowsInt - 1].map((x, i) =>
        (x === undefined || x == '' ? 'Column ' + (i + 1) : _.trim(String(x)))
      );
      newState.inColumnNames = _.concat(
        columnNames,
        _.slice(newState.inColumnNames, columnNames.length)
      );
    }

    // Update the output column names list.
    newState.errors.columnNames = [];
    newState.outColumnNames = _.concat(
      _.slice(newState.outColumnNames, 0, newState.inColumnNames.length),
      _.slice(Array(newState.inColumnNames.length), newState.outColumnNames.length)
    );

    newState.outColumnNameCounts = _.countBy(newState.outColumnNames);
    newState.excludeColumnIdxs.map((idx) => {
      let columnName = newState.outColumnNames[idx];
      if (columnName !== undefined && newState.outColumnNameCounts[columnName])
        newState.outColumnNameCounts[columnName] -= 1;
    });

    newState.outColumnNames = newState.outColumnNames.map((outColumnName, i) => {

      // If the table name is not selected, don't add errors and leave the column name selections intact.
      if (newState.errors.tableName.length > 0 || nextState.excludeColumnIdxs.indexOf(i) >= 0) return outColumnName;

      // If the output column name isn't empty, check that it's valid for the selected table.
      if (outColumnName !== undefined &&
        _.indexOf(
          _.keys(this.props.dataModel.tables[newState.settings.tableName].columns),
          outColumnName
        ) === -1) {
        newState.errors.columnNames.push('Selected column name "' + outColumnName +
          '" is unrecognized in column number ' + (i+1) + ' for table name "' + newState.settings.tableName + '".');
      }

      // If the output column name is empty, see if the input column name is valid for the selected table.
      if (outColumnName === undefined) {
        let modelColumnByName, modelColumnByLabel;
        for (let columnName in this.props.dataModel.tables[newState.settings.tableName].columns) {
          const columnLabel = this.props.dataModel.tables[newState.settings.tableName].columns[columnName].label;
          if (newState.inColumnNames[i] && (
              newState.inColumnNames[i].toLowerCase() === columnName.toLowerCase() ||
              newState.inColumnNames[i].toLowerCase() === columnLabel.toLowerCase()))
            modelColumnByLabel = columnName;
        }
        if (modelColumnByName !== undefined)
          outColumnName = modelColumnByName;
        else if (modelColumnByLabel !== undefined)
          outColumnName = modelColumnByLabel;
        else
          newState.errors.columnNames.push('Column name "' + newState.inColumnNames[i] +
            '" is unrecognized in column number ' + (i + 1) + ' for table name "' + newState.settings.tableName + '".');
      }

      if (outColumnName !== undefined && newState.outColumnNameCounts[outColumnName] > 1)
        newState.errors.columnNames.push('Column name "' + newState.inColumnNames[i] +
          '" in column number ' + (i + 1) + ' and another column are both importing into the "' +
          newState.settings.tableName + '.' + outColumnName + '" data model column. ' +
          'Either exclude the duplicate columns or change their import column.');

      // Otherwise, return the column name.
      return outColumnName;

    });

    newState.settings.columnMap = {};
    newState.inColumnNames.forEach((inColumnName, i) => {
      if (newState.outColumnNames.length > i)
        newState.settings.columnMap[inColumnName] = newState.outColumnNames[i];
    });

    newState.settings.excludeColumnNames = newState.excludeColumnIdxs.map((idx) => newState.inColumnNames[idx]);

    let nRows = 0;
    nextState.in.forEach((row, rowIdx) => {
      nRows += 1;
      if (Array.isArray(row)) {
        let isEmptyRow = true;
        for (let colIdx = 0; colIdx <= row.length; colIdx++) {
          if (!_.isEmpty(row[colIdx])) {
            isEmptyRow = false;
            break;
          }
        }
        if (isEmptyRow && newState.excludeRowIdxs.indexOf(rowIdx) === -1)
          newState.excludeRowIdxs.push(rowIdx);
      }
    });
    newState.nRows = nRows;

    // Validate the data array.
    newState.errors.data = [];
    if (!Array.isArray(nextProps.data))
      newState.errors.data.push('Failed to parse the data into an array.');
    if (Array.isArray(nextProps.data) && newState.inColumnNames.length - newState.excludeColumnIdxs.length <= 0)
      newState.errors.data.push('There are no rows to import.');
    else if (Array.isArray(nextProps.data) && nextProps.data.length - newState.excludeRowIdxs.length - newState.nHeaderRowsInt <= 0)
      newState.errors.data.push('There are no columns to import.');
    //if (newState.errors.data.length > 0)
    //  newState.settings.excludeTable = true;
    if (newState.settings.excludeTable)
      newState.errors.data.push(newState.settings.tableName ? 'Skipping table "' + newState.settings.tableName + '".' : 'Skipping this table.');

    // Update the state instead of the component if necessary.
    //console.log('changed?', newState, nextState);
    if (nextState.isLoaded && !_.isEqual(newState.settings, nextState.settings)) {
      //console.log('settings changed!');
      newState.hasChanged = true;
    }
    if (!_.isEqual(newState, nextState)) {
      //console.log('state changed!');
      this.setState(newState);
    }


  }

  componentDidUpdate(prevProps, prevState) {

    //console.log('updated');

    $(this.refs['errors accordion']).not('.ui-accordion').addClass('ui-accordion').accordion();
    $(this.refs['table column headers']).find('.ui.checkbox:not(.ui-checkbox)').addClass('ui-checkbox').checkbox({
      onChange: $.proxy(function (react) {
        const columnIdx = $(this).data('column-idx');
        if (columnIdx === -1) {
          _.delay(() => {
            let settings = react.state.settings;
            settings.excludeTable = !$(this).prop('checked');
            react.setState({settings: settings})
          });
        } else {
          let excludeColumnIdxs = react.state.excludeColumnIdxs;
          _.pull(excludeColumnIdxs, columnIdx);
          if (!$(this).prop('checked')) excludeColumnIdxs.push(columnIdx);
          _.delay(() => {
            react.setState({excludeColumnIdxs: excludeColumnIdxs})
          });
        }
      }, undefined, this)
    });
    $(this.refs['table body']).find('.ui.checkbox:not(.ui-checkbox)').addClass('ui-checkbox').checkbox({
      onChange: $.proxy(function (react) {
        let excludeRowIdxs = react.state.excludeRowIdxs;
        _.pull(excludeRowIdxs, $(this).data('row-idx'));
        if (!$(this).prop('checked')) excludeRowIdxs.push($(this).data('row-idx'));
        _.delay(() => { react.setState({excludeRowIdxs: excludeRowIdxs})});
      }, undefined, this)
    });

    $(this.refs['table column names']).find('.ui.dropdown:not(.ui-dropdown)').addClass('ui-dropdown').each((i, dropdown) => {
      $(dropdown).dropdown({
        direction: 'downward',
        selectOnKeydown: false,
        forceSelection: false,
        keepOnScreen: false,
        fullTextSearch: 'exact',
        onChange: (value, text, $choice) => {
          if ($choice.data) {
            let outColumnNames = this.state.outColumnNames;
            outColumnNames[$choice.data('column-idx')] = value;
            _.delay(() => this.setState({outColumnNames: outColumnNames}));
          }
        },
        onShow: () => {
          const columnIdx = $(dropdown).data('column-idx');
          let loadedColumnMenu = this.state.loadedColumnMenu;
          loadedColumnMenu[columnIdx] = true;
          this.setState({loadedColumnMenu: loadedColumnMenu});
        }
      });
    });
    $(this.refs['table column names']).find('.ui.dropdown.ui-dropdown').dropdown('refresh');

    $(this.refs['table column units']).find('.ui.dropdown:not(.ui-dropdown)').addClass('ui-dropdown').dropdown({
      fullTextSearch: 'exact'
    });
    $(this.refs['table column units']).find('.ui.dropdown.ui-dropdown').dropdown('refresh');

    if (this.state.templateName)
      $(this.refs['import settings template dropdown']).dropdown('set text', this.state.templateName);
    else
      $(this.refs['import settings template dropdown']).dropdown('restore placeholder text');

    let readyState = {
      tableName: this.state.settings.tableName,
      nErrors: _.reduce(this.state.errors, (sum, errors) => sum + errors.length, 0),
      outColumnNames: this.state.outColumnNames,
      nExcludeColumnIdxs: this.state.excludeColumnIdxs.length,
      nExcludeRowIdxs: this.state.excludeRowIdxs.length,
      excludeTable: this.state.settings.excludeTable
    };
    if (!_.isEqual(this.lastReadyState, readyState)) {
      this.lastReadyState = readyState;
      if (readyState.excludeTable && this.props.onReady) {
        this.props.onReady(undefined, undefined, undefined);
      }
      else if (readyState.nErrors === 0 && this.props.onReady) {
        let columns = [];
        for (let columnIdx in this.state.outColumnNames) {
          if (this.state.excludeColumnIdxs.indexOf(columnIdx) === -1)
            columns.push(this.state.outColumnNames[columnIdx]);
        }
        let rowIdxs = [];
        for (let rowIdx in this.state.in) {
          rowIdx = parseInt(rowIdx);
          if (rowIdx >= this.state.nHeaderRowsInt && this.state.excludeRowIdxs.indexOf(rowIdx) === -1)
            rowIdxs.push(rowIdx);
        }
        this.props.onReady(this.state.settings.tableName, columns, rowIdxs);
      }
      else if (this.props.onNotReady)
        this.props.onNotReady();
    }
  }

  guessHeaderRows(data, dataModelTables) {
    let nHeaderRows;
    const tableNames = _.keys(dataModelTables);
    if (Array.isArray(data)) {
      data.slice(0, 100).forEach((row, idx) => {
        console.log('guessHeaderRows', row[0], tableNames);
        if (!nHeaderRows && row[0].toLowerCase && _.indexOf(tableNames, `${row[0].toLowerCase()}s`) >= 0)
          nHeaderRows = `${idx+1}`;
      })
    }
    return nHeaderRows || '1';
  }

  portalColor() {
    const portal = this.props.portal || 'EarthRef.org';
    return portals[portal] && portals[portal].color || 'green';
  }

  columnIsDownloadOnly(i) {
    let outColumnName = (i < this.state.outColumnNames.length ? this.state.outColumnNames[i] : undefined);
    let dataModelTable = this.state.settings.tableName && this.props.dataModel.tables[this.state.settings.tableName];
    let dataModelColumn = dataModelTable && dataModelTable.columns[outColumnName];
    let validations = dataModelColumn && dataModelColumn.validations;
    return validations && /downloadOnly\(\)/.test(validations);
  }

  renderOptions() {
    return (
      <div>
        <div className="ui grid" style={{marginTop:0}}>
          <div className="seven wide column">
            <div className="ui labeled fluid action input">
              <div ref="import settings template dropdown" className="ui selection fluid dropdown button" style={{borderTopRightRadius:0, borderBottomRightRadius:0, flex:'1 1 auto'}}>
                <i className="dropdown icon"/>
                <div className="default text">
                  <span className="text">{this.state.templateName || 'Select to Load Template'}</span>
                </div>
                <div className="menu">
                  <div data-value="" data-text="Clear Import Settings" className="item">
                    <span className="text">Clear Import Settings</span>
                  </div>
                  {this.state.templatesReady ?
                      this.importTemplates.length ? this.importTemplates.map((template, i) =>
                        <div key={i} data-value={template._id} data-text={template._name} className="item">
                          <div className="ui icon compact mini right floated negative button" style={{margin:'-0.5em'}}
                            onClick={(e) => {
                              $(this.refs['delete import settings template name']).text(template._name);
                              $(this.refs['delete import settings template ID']).val(template._id);
                              $(this.refs['delete import settings template']).modal('show');
                            }}
                          >
                            <i className="close icon"/>
                            Delete
                          </div>
                          <div className="ui icon compact mini right floated button" style={{margin:'-0.5em'}}
                            onClick={(e) => {
                              $(this.refs['rename import settings template name']).val(template._name);
                              $(this.refs['rename import settings template ID']).val(template._id);
                              $(this.refs['rename import settings template']).modal('show');
                            }}
                          >
                            <i className="write icon"/>
                            Rename
                          </div>
                          <span className="description">
                            {moment(template._inserted).calendar()}
                          </span>
                          <span className="text">
                            {template._name}
                          </span>
                        </div>
                      )
                    :
                      <div className="disabled item">
                        There are currently no templates in your private workspace. Please create a new template to reuse it in future uploads.
                      </div>
                  :
                    <div className="item">
                      Loading templates ...
                    </div>
                  }
                </div>
              </div>
              {this.state.templateID &&
              <div ref="import template save"
                  className={'ui icon button' + (this.state.hasChanged ? '' : ' disabled')}
                  style={{flex: '0 0 auto'}}
                  onClick={(e) => {
                    $(this.refs['save import settings template']).modal('show');
                  }}
              >
                <i className="save icon"/>
                Save Changes
              </div>}
              <div ref="import template create" className="ui icon button"
                  style={{flex:'0 0 auto', borderLeft: '1px solid rgba(34, 36, 38, 0.15)'}}
                  onClick={(e) => {
                    this.refs['create import settings template name'].value = '';
                    $(this.refs['create import settings template']).modal('show');
                  }}
              >
                <i className="plus icon"/>
                New
              </div>
            </div>
          </div>
          <div className="five wide column">
            <div className="ui labeled fluid action input">
              <div className={'ui basic label ' + (this.state.settings.tableName === '' && !this.state.settings.excludeTable ? 'red' : this.portalColor())}>
                Table Name
              </div>
              <div ref="table name dropdown"
                   className={"ui selection fluid dropdown" + (this.state.settings.tableName === '' && !this.state.settings.excludeTable ? ' error' : '')}>
                <i className="dropdown icon"/>
                <div className="default text">
                  <span className="text">{this.state.settings.tableName || 'Select One'}</span>
                </div>
                <div className="menu">
                  {(_.keys(this.props.dataModel.tables).map((table, i) => {
                    return (
                      <div key={i} data-value={table} className="item">
                        {this.props.dataModel.tables[table].label}
                      </div>
                    );
                  }))}
                </div>
              </div>
            </div>
          </div>
          <div className="four wide column">
            <div className={"ui labeled fluid input" + (this.state.errors.nHeaderRows.length === 0 || this.state.settings.excludeTable ? '' : ' error')}>
              <div className={"ui label" + (this.state.errors.nHeaderRows.length === 0 || this.state.settings.excludeTable ? '' : ' red')}>
                # Header Rows
              </div>
              <input ref="header_row_input" type="text" default="None" value={this.state.settings.nHeaderRows}
                     onChange={(e) => {
                       let settings = this.state.settings;
                       settings.nHeaderRows = this.refs['header_row_input'].value;
                       this.setState({settings: settings})}}/>
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderErrors() {
    const nErrors = _.reduce(this.state.errors, (sum, errors) => sum + errors.length, 0);
    const nDataErrors = this.state.errors.data.length;
    if (this.state.settings.excludeTable || nDataErrors > 0)
      return (<table className="ui compact small inverted table yellow">
        <tbody>
        <tr>
          <td><i className="warning sign icon"></i><b>
            {nDataErrors + ' Import Warning' + (nDataErrors > 1 ? 's' : '')}
          </b></td>
        </tr>
        {this.state.errors.data.map((error, i) =>
          <tr className="warning" key={i}>
            <td>{error}</td>
          </tr>
        )}
        </tbody>
      </table>);
    else if (nErrors > 0)
      return (<table className="ui compact small inverted table red">
        <tbody>
        <tr>
          <td><i className="warning sign icon"></i><b>
            {nErrors + ' Import Error' + (nErrors > 1 ? 's' : '')}
          </b></td>
        </tr>
        {_.keys(this.state.errors).map((error_group, i) => {
          return this.state.errors[error_group].map((error, j) => {
            return (
              <tr className="error" key={i + '.' + j}>
                <td>{error}</td>
              </tr>
            );
          })
        })}
        </tbody>
      </table>);
    else
      return undefined;
  }

  renderColumnHeaderDropdownMenu(columnIdx) {
    const menuLoaded = this.state.loadedColumnMenu[columnIdx];
    return (this.state.errors.tableName.length > 0 ?
        <div className="menu">
          <div className="ui error message">
            <div className="header">Error</div>
            <p>"Table Name" must be selected.</p>
          </div>
        </div>
        :
        <div className="menu">
          {_.sortBy(
            _.keys(this.props.dataModel.tables[this.state.settings.tableName].columns),
            (columnName) => this.props.dataModel.tables[this.state.settings.tableName].columns[columnName].position
          ).map((columnName, i) => {
            return (menuLoaded || this.state.outColumnNames[columnIdx] === columnName ?
                <div className="item" key={i} data-value={columnName} data-column-idx={columnIdx}>
                  <span className="description">
                    {columnName}
                  </span>
                  <span className="text">
                    {this.props.dataModel.tables[this.state.settings.tableName].columns[columnName].label}
                  </span>
                </div> : undefined
            );
          })
          }
          {!menuLoaded ?
            <div className="header">
              <i className="loading circle notched icon"/>
              Loading
            </div> : undefined}
        </div>
    );
  }

  renderTable() {
    const nRows = Math.max(0, this.state.nRows - this.state.excludeRowIdxs.length - this.state.nHeaderRowsInt);
    const nCols = Math.max(0, this.state.inColumnNames.length - this.state.excludeColumnIdxs.length);
    const tableTooltip = 'Click to ' + (this.state.settings.excludeTable ? 'include' : 'exclude') + ' this table.';
    //console.log('renderTable');
    return (
      <div style={{marginTop:'1em'}}>
        <FixedTable className="ui compact celled striped definition single line table">
          <thead>
          <tr ref="table column headers">
            <th style={{pointerEvents: 'auto'}}>
              <div className="ui fitted toggle left floated checkbox"
                   data-column-idx={-1}
                   data-position="bottom left"
                   data-tooltip={tableTooltip}>
                <input type="checkbox" defaultChecked={!this.state.settings.excludeTable} data-column-idx={-1}/>
              </div>
            </th>
            {(this.state.inColumnNames.map((columnName, i) => {
              const downloadOnly = this.columnIsDownloadOnly(i);
              const excluded = this.state.excludeColumnIdxs.indexOf(i) >= 0;
              const tooltip = (downloadOnly ? 'Column is "Download Only".' :
                'Click to ' + (excluded ? 'include' : 'exclude') + '.');
              return (
                <th key={i}>
                  <div className={'ui fitted toggle right floated checkbox' + (downloadOnly || this.state.settings.excludeTable ? ' disabled' : '')}
                       data-position="bottom right"
                       data-column-idx={i}
                       data-tooltip={tooltip}>
                    <input type="checkbox" defaultChecked={!downloadOnly && !excluded} data-column-idx={i}/>
                  </div>
                  <span style={!downloadOnly && !excluded && !this.state.settings.excludeTable ? {} : { color: '#888' }}>
                      {columnName}
                    </span>
                </th>
              );
            }))}
          </tr>
          </thead>
          <tbody ref="table body">
          <tr ref="table column names">
            <td className="collapsing right aligned">Name</td>
            {(this.state.outColumnNames.map((outColumnName, i) => {
              return (
                <td key={i}
                    className={
                      'ui fluid dropdown' +
                      (this.state.excludeColumnIdxs.indexOf(i) === -1 && !this.state.settings.excludeTable ? '' : ' disabled') +
                      (this.state.errors.tableName.length > 0 ? '' : ' search') +
                      (!this.state.settings.excludeTable && (this.state.errors.tableName.length > 0 ||
                      outColumnName === undefined ||
                      this.state.outColumnNameCounts[outColumnName] > 1 ||
                      this.props.dataModel.tables[this.state.settings.tableName].columns[outColumnName] === undefined) ?
                        ' error' : '')
                    }
                    style={{display: 'table-cell', width: 'initial'}}
                    data-column-idx={i}
                    data-outColumnName={outColumnName}
                >
                  <input type="hidden" value={outColumnName}/>
                  <i className="dropdown icon"/>
                  <div className="default text">
                    <span className="text">Select One</span>
                  </div>
                  {this.renderColumnHeaderDropdownMenu(i)}
                </td>
              );
            }))}
          </tr>
          <tr ref="table column">
            <td className="collapsing right aligned">Column</td>
            {(this.state.inColumnNames.map((columnName, i) => {
              const outColumnName = this.state.outColumnNames[i];
              const modelColumn = (
                this.state.errors.tableName.length > 0 || outColumnName === undefined ?
                  undefined
                  :
                  this.props.dataModel.tables[this.state.settings.tableName].columns[outColumnName]
              );
              return (this.state.excludeColumnIdxs.indexOf(i) === -1 && !this.state.settings.excludeTable ?
                  (modelColumn === undefined ?
                      <td key={i} className="error"></td>
                      :
                      <td key={i}>{outColumnName}</td>
                  )
                  :
                  <td key={i} className="disabled"></td>
              );
            }))}
          </tr>
          <tr ref="table column units">
            <td className="collapsing right aligned">Units</td>
            {(this.state.inColumnNames.map((columnName, i) => {
              const outColumnName = this.state.outColumnNames[i];
              const modelColumn = (
                this.state.errors.tableName.length > 0 || outColumnName === undefined ?
                  undefined
                  :
                  this.props.dataModel.tables[this.state.settings.tableName].columns[outColumnName]
              );
              return (this.state.excludeColumnIdxs.indexOf(i) === -1 && !this.state.settings.excludeTable ?
                  (modelColumn === undefined ?
                      <td key={i} className="error"></td>
                      :
                      (modelColumn.other_units === undefined ?
                          <td key={i} className={(modelColumn.unit === undefined ? 'disabled' : '')}>
                            {(modelColumn.unit === undefined ? 'None' : modelColumn.unit)}
                          </td>
                          :
                          <td key={i} className="ui dropdown" style={{display:'table-cell'}}>
                            <div className="default text">
                              <span className="text">Select One</span>
                            </div>
                            <i className="caret down icon"/>
                            <div className="menu">
                              {_.concat(modelColumn.unit, _.keys(modelColumn.other_units)).map((unit, j) =>
                                <div className="item" key={j}>
                                  {unit}
                                </div>
                              )}
                            </div>
                          </td>
                      )
                  )
                  :
                  <td key={i} className="disabled"></td>
              );
            }))}
          </tr>
          {this.state.in.map((row, i) => {
            return (
              i < this.state.nHeaderRowsInt + this.state.maxDataRows && (
              this.state.nHeaderRows === '' ||
              this.state.errors.nHeaderRows.length > 0 ||
              i >= this.state.nHeaderRowsInt) ?
                <tr key={i}>
                  <td className="collapsing right aligned">
                    <div className={'ui fitted toggle left floated checkbox' + (this.state.settings.excludeTable ? ' disabled' : '')} data-position="top left"
                         data-tooltip={'Click to ' + (this.state.excludeRowIdxs.indexOf(i) === -1 ? 'exclude' : 'include')}>
                      <input type="checkbox" defaultChecked={this.state.excludeRowIdxs.indexOf(i) === -1} data-row-idx={i}/>
                    </div>
                    <span style={this.state.excludeRowIdxs.indexOf(i) === -1 && !this.state.settings.excludeTable ? {} : {color:  '#888'}}>
                        {i+1}
                      </span>
                  </td>
                  {(row.map((col, j) => {
                    const downloadOnly = this.columnIsDownloadOnly(j);
                    const className = (downloadOnly || this.state.excludeColumnIdxs.indexOf(j) >= 0 ||
                    this.state.excludeRowIdxs.indexOf(i) >= 0 || this.state.settings.excludeTable ? 'disabled' : '');
                    return (
                      <td key={j} className={className}>{col}</td>
                    );
                  }))}
                </tr>
                :
                undefined
            );
          })}
          {(this.state.nHeaderRows === '' && this.state.in.length === 0 ||
          this.state.nHeaderRows >= this.state.in.length ? undefined :
            _.times(this.state.nHeaderRowsInt + this.state.minDataRows - this.state.in.length, (i) =>
              <tr key={i}>
                <td className="collapsing right aligned">{this.state.in.length + i + 1}</td>
                <td colSpan={this.state.outColumnNames.length}></td>
              </tr>))}
          </tbody>
        </FixedTable>
        <div className="ui two column grid" style={{marginTop: '0'}}>
          <div className="column">
            {(this.state.nHeaderRowsInt + this.state.maxDataRows < this.state.in.length ?
                <a className={'ui horizontal label ' + this.portalColor()}
                   onClick={(e) => this.setState({maxDataRows: this.state.maxDataRows + this.state.minDataRows})}>
                  <i className="plus icon"/>
                  Preview More Rows
                </a> : undefined
            )}
            {(this.state.maxDataRows > this.state.minDataRows ?
                <a className={'ui horizontal label ' + this.portalColor()}
                   onClick={(e) => this.setState({maxDataRows: this.state.minDataRows})}>
                  <i className="undo icon"/>
                  Preview Less Rows
                </a> : undefined
            )}
            {(this.state.nHeaderRowsInt + this.state.maxDataRows < this.state.in.length ?
                <a className={'ui horizontal label ' + this.portalColor()}
                   onClick={(e) => this.setState({maxDataRows: this.state.in.length})}>
                  <i className="plus icon"/>
                  Show All Rows
                </a> : 
                <a className={this.portalColor()}>
                  All Rows Are Displayed 
                </a>
            )}
          </div>
          <div className="right aligned column">
            Importing <div className={'ui horizontal label ' + this.portalColor()}>
            {!this.state.settings.excludeTable && (nRows + (this.props.nOverflowRows || 0)) || 0}
          </div>{(nRows === 1 ? 'row' : 'rows')} with <div className={'ui horizontal label ' + this.portalColor()}>
            {nCols}
          </div>{(nCols === 1 ? 'column.' : 'columns.')}
          </div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className={'er-data-importer ' + (this.props.className || '')} style={this.props.style}>
        <div ref="create import settings template" className="ui modal">
          <div className="ui icon header">
            <i className="settings icon"></i>
            Import Settings Template
          </div>
          <div className="content">
            <div className="ui header">
              Create a new template from the current import settings with the name:
            </div>
            <div className="ui fluid input">
              <input ref="create import settings template name"/>
            </div>
          </div>
          <div className="actions">
            <div className="ui red approve button">
              <i className="star icon"></i>
              Create
            </div>
            <div className="ui cancel button">Cancel</div>
          </div>
        </div>
        <div ref="save import settings template" className="ui modal">
          <div className="ui icon header">
            <i className="settings icon"></i>
            Import Settings Template
          </div>
          <div className="content">
            <input type="hidden" ref="save import settings template ID"/>
            <div className="ui header">
              Save changes to template "<span style={{verticalAlign: 'inherit'}}>{this.state.templateName}</span>"?
            </div>
          </div>
          <div className="actions">
            <div className="ui red approve button">
              <i className="save icon"></i>
              Save Changes
            </div>
            <div className="ui cancel button">Cancel</div>
          </div>
        </div>
        <div ref="delete import settings template" className="ui modal">
          <div className="ui icon header">
            <i className="settings icon"></i>
            Import Settings Template
          </div>
          <div className="content">
            <input type="hidden" ref="delete import settings template ID"/>
            <div className="ui header">
              Delete template "<span ref="delete import settings template name" style={{verticalAlign: 'inherit'}}></span>"?
            </div>
          </div>
          <div className="actions">
            <div className="ui red approve button">
              <i className="close icon"></i>
              Delete Template
            </div>
            <div className="ui cancel button">Cancel</div>
          </div>
        </div>
        <div ref="rename import settings template" className="ui modal">
          <div className="ui icon header">
            <i className="settings icon"></i>
            Import Settings Template
          </div>
          <div className="content">
            <input type="hidden" ref="rename import settings template ID"/>
            <div className="ui header">
              Rename template as:
            </div>
            <div className="ui fluid input">
              <input ref="rename import settings template name"/>
            </div>
          </div>
          <div className="actions">
            <div className="ui red approve button">
              <i className="pencil icon"></i>
              Rename
            </div>
            <div className="ui cancel button">Cancel</div>
          </div>
        </div>
        {this.renderOptions()}
        {this.renderErrors()}
        {this.props.data && this.props.data.length && this.renderTable() || undefined}
      </div>
    );
  }

}

DataImporter.propTypes = {
  dataModel: PropTypes.object.isRequired
};
