/* Instructions for updating:

    1) Go to https://docs.google.com/spreadsheets/d/1ldYzO6WMyxfVT6gv3imKaZIVqvp97uPmWijT_ElpZnY and 
      copy the JSON cells (column S row 2 to the last entry in column U).
    2) Go to https://jsonlint.com/, paste the JSON into the text area, click "Validate JSON", and 
      copy the formatted JSON.
    3) Replace the JSON starting after "'tables': " roughly on line 426 and before the "};" at the end.
    4) Update the 'updated_day' field at the beginning.

*/

export const model = {
	'updated_day': '2021:03:12',
	'published_day': '2021:03:12',
	'data_model_version': '1.0',
	'tables': {	
		'contribution': {
			'label': 'Contribution',
			'position': 1,
			'description': 'Contribution metadata',
			'notes': 'Batch uploads, but information can be added manually before activation',
			'columns': {
				'id': {
					'label': 'Contribution ID',
					'group': 'Contribution',
					'position': 1,
					'type': 'Integer',
					'description': 'Unique KdD Contribution ID',
					'notes': 'Written during contribution activation',
					'examples': ['112'],
					'validations': ['downloadOnly()']
				},
				'version': {
					'label': 'Version',
					'group': 'Contribution',
					'position': 2,
					'type': 'Integer',
					'description': 'Contribution version number',
					'notes': '1 for original contribution, 6 for latest contribution if there are 6 versions, empty if the contribution is not activated, written during contribution activation',
					'validations': ['downloadOnly()']
				},
				'timestamp': {
					'label': 'Activation Timestamp',
					'group': 'Contribution',
					'position': 3,
					'type': 'Timestamp',
					'description': 'Date and time of contribution activation',
					'notes': 'ISO 8601 date and time (e.g. "yyyy-mm-ddThh:mm:ss.sssZ"), written during contribution activation',
					'examples': ['2017', '2014-04-21', '1970-01-01T00:00:00', '1969-07-20T22:56:15-04:00'],
					'validations': ['downloadOnly()']
				},
				'contributor': {
					'label': 'Contributor',
					'group': 'Contribution',
					'position': 4,
					'type': 'String',
					'description': 'Contributor EarthRef handle',
					'notes': 'Written during contribution activation',
					'examples': ['@njarboe'],
					'validations': ['downloadOnly()']
				},
				'is_validated': {
					'label': 'Is Validated',
					'group': 'Contribution',
					'position': 5,
					'type': 'String',
					'unit': 'Flag',
					'description': 'Contribution has passed the KdD Data Model validation',
					'validations': ['cv("boolean")', 'downloadOnly()']
				},
				'is_reviewed': {
					'label': 'Is Reviewed',
					'group': 'Contribution',
					'position': 6,
					'type': 'String',
					'unit': 'Flag',
					'description': 'Contribution has been reviewed for correct usage of the KdD Data Model',
					'validations': ['cv("boolean")', 'downloadOnly()']
				},
				'data_model_version': {
					'label': 'Data Model Version',
					'group': 'Contribution',
					'position': 7,
					'type': 'String',
					'description': 'KdD data model version',
					'notes': 'Written during contribution activation',
					'examples': ['1.0'],
					'validations': ['cv("kdd_version")', 'downloadOnly()']
				},
				'reference': {
					'label': 'Contribution Reference',
					'group': 'Contribution',
					'position': 8,
					'type': 'String',
					'description': 'The DOI or URL for the document describing this study',
					'notes': 'The DOI must resolve to a publisher or the URL to a web page',
					'examples': ['10.1029/92JB01202', '10.1023/A:1015035228810', 'https://my-university.edu/my_phd_thesis.pdf'],
					'validations': ['type("references")', 'required()']
				},
				'author': {
					'label': 'Original Author',
					'group': 'Contribution',
					'position': 9,
					'type': 'String',
					'description': 'Original author EarthRef handle or name and email or ORCID',
					'examples': ['@cconstable', 'Not A. Member <no.earthref.handle@gmail.com>', '0000-0002-9000-2100'],
					'validations': ['type("users")']
				},
				'lab_names': {
					'label': 'Laboratory Names',
					'group': 'Contribution',
					'position': 10,
					'type': 'List',
					'description': 'List of labs (with institution and country) where the measurements in the contribution were made',
					'notes': 'European Labs use names from EPOS MLS',
					'examples': ['Paleomagnetic Laboratory Fort Hoofddijk (Utrecht University, The Netherlands)', 'Paleomagnetic Laboratory (INGV,  Italy)'],
					'validations': ['cv("lab_names")', 'recommended()']
				},
				'supplemental_links': {
					'label': 'Supplemental Data Links',
					'group': 'Contribution',
					'position': 11,
					'type': 'Dictionary',
					'description': 'Display name for the link and the permanent URL to the supplemental data',
					'examples': ['Geomagnetic Field Model[https://earthref.org/ERDA/1137/]', 'Geochemistry Data[https://earthref.org/ERDA/192/]:PADM2M Field Model[https://earthref.org/ERDA/1138/]']
				},
				'description': {
					'label': 'Description',
					'group': 'Contribution',
					'position': 12,
					'type': 'String',
					'description': 'Contribution description and update comments',
					'examples': ['Fixes errors in latitudes and adds measurement data'],
					'validations': ['recommended()']
				}
			}
		},
		'kds': {
			'label': 'Partition Coefficients',
			'position': 2,
			'columns': {
				'contribution_id': {
					'label': 'Contribution ID',
					'group': 'Contribution',
					'position': 1,
					'type': 'Integer',
					'description': 'Unique KdD Contribution ID',
					'notes': 'Written during contribution activation',
					'examples': ['5412'],
					'validations': ['downloadOnly()']
				},
				'rock_types': {
					'label': 'Rock Types',
					'group': 'Classification',
					'position': 2,
					'type': 'List',
					'description': 'Colon-delimited list of rock types',
					'examples': ['Alkali Basalt', 'Andesite', 'Trachyte'],
					'validations': ['required()']
				},
				'minerals': {
					'label': 'Minerals',
					'group': 'Classification',
					'position': 3,
					'type': 'List',
					'description': 'Colon-delimited list of minerals',
					'examples': ['Amphibole', 'Clinopyroxene', 'Plagioclase'],
					'validations': ['required()']
				},
				'element': {
					'label': 'Element',
					'group': 'Classification',
					'position': 4,
					'type': 'String',
					'description': 'Element',
					'examples': ['Na', 'Rb', 'Cs'],
					'validations': ['required()']
				},
				'kd': {
					'label': 'Kd',
					'group': 'Partition Coefficient',
					'position': 5,
					'type': 'Number',
					'unit': 'Dimensionless',
					'description': 'Partition coefficient',
					'validations': ['required()', 'min(0)']
				},
				'kd_sigma': {
					'label': 'Kd Sigma',
					'group': 'Partition Coefficient',
					'position': 6,
					'type': 'Number',
					'unit': 'Dimensionless',
					'description': 'Partition coefficient uncertainty, One sigma',
					'notes': 'Standard error or standard deviation at one sigma',
					'validations': ['min(0)']
				},
				'kd_low': {
					'label': 'Kd Low',
					'group': 'Partition Coefficient',
					'position': 7,
					'type': 'Number',
					'unit': 'Dimensionless',
					'description': 'Partition coefficient, Low range',
					'validations': ['min(0)']
				},
				'kd_high': {
					'label': 'Kd High',
					'group': 'Partition Coefficient',
					'position': 8,
					'type': 'Number',
					'unit': 'Dimensionless',
					'description': 'Partition coefficient, High range',
					'validations': ['min(0)']
				},
				'kd_definition': {
					'label': 'Kd Definition',
					'group': 'Partition Coefficient',
					'position': 9,
					'type': 'String',
					'description': 'Partition coefficient definition',
					'examples': ['Solid-Melt', 'Metal-Silicate-Solids']
				},
				'kd_types': {
					'label': 'Kd Types',
					'group': 'Partition Coefficient',
					'position': 10,
					'type': 'List',
					'description': 'Colon-delimited list of partition coefficient types',
					'examples': ['Experimental', 'Phenocryst-Matrix']
				}
			}
		}
	}
};