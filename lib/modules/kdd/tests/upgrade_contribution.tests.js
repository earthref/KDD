const {describe, it} = global;
import {expect} from 'chai';
import _ from 'lodash';
import Promise from 'bluebird';
import ParseContribution from '/lib/modules/kdd/parse_contribution';
import UpgradeContribution from '/lib/modules/kdd/upgrade_contribution';
import ValidateContribution from '/lib/modules/kdd/validate_contribution';
import {default as contribution10507} from '/lib/modules/kdd/unit_tests/files/contributions/10507_partial';

describe('magic.actions.upgrade_contribution', function () {

  // Test upgrading invalid JSON.
  describe('when upgrading invalid JSON', function () {
    
    it('should reject if the table name is invalid.', function () {
      const jsonOld = {
        contribution: [{
          magic_version: '2.5'
        }],
        not_er_locations: [{
          region: 'California'
        }]
      };
      return upgradeContributionErrorTest(jsonOld,
        /table .* is not defined in magic data model version /i);
    });

    it('should reject if the column name is invalid.', function () {
      const jsonOld = {
        contribution: [{
          magic_version: '2.5'
        }],
        er_locations: [{
          not_region: 'California'
        }]
      };
      return upgradeContributionErrorTest(jsonOld,
        /column .* in table .* is not defined in magic data model/i);
    });

    it('should report one error if the same two columns are invalid.', function () {
      const jsonOld = {
        contribution: [{
          magic_version: '2.4'
        }],
        er_locations: [{
          not_region: 'California'
        },{
          not_region: 'California'
        }]
      };
      return Promise.all([
        upgradeContributionNErrorsTest(jsonOld, 1),
        upgradeContributionErrorTest(jsonOld,
          /column .* in table .* is not defined in magic data model/i)
      ]);
    });
    
    it('should report two errors if two different columns are invalid.', function () {
      const jsonOld = {
        contribution: [{
          magic_version: '2.4'
        }],
        er_locations: [{
          not_region: 'California'
        },{
          not_region2: 'California'
        }]
      };
      return Promise.all([
        upgradeContributionNErrorsTest(jsonOld, 2),
        upgradeContributionErrorTest(jsonOld,
         /column .* in table .* is not defined in magic data model/i)
      ]);
    });

    it('should report one error if two different relative intensity normalizations are used', function () {
      const jsonOld = {
        contribution: [{
          magic_version: '2.5'
        }],
        er_sites: [{
          er_site_name: 'site_1'
        }],
        pmag_results: [{
          er_site_names: 'site_1',
          average_int_rel: '1',
          average_int_rel_sigma: '2',
          magic_method_codes: 'IE-IRM:IE-ARM'
        }]
      };
      const jsonNew = {
        contribution: [{
          magic_version: '2.5'
        }],
        er_sites: [{
          er_site_name: 'site_1'
        }],
        pmag_results: [{
          er_site_names: 'site_1',
          average_int_rel: '1',
          average_int_rel_sigma: '2',
          magic_method_codes: 'IE-IRM:IE-ARM:IE-CHI'
        }]
      };
      return Promise.all([
        upgradeContributionNErrorsTest(_.cloneDeep(jsonOld), 1),
        upgradeContributionErrorTest(_.cloneDeep(jsonOld),
          /row .* in table .* includes more than one type of relative intensity normalization in the method codes/i)
      ]);
    });

    it('should report one error if several different relative intensity normalizations are used', function () {
      const jsonOld = {
        contribution: [{
          magic_version: '2.5'
        }],
        er_sites: [{
          er_site_name: 'site_1'
        }],
        pmag_results: [{
          er_site_names: 'site_1',
          average_int_rel: '1',
          average_int_rel_sigma: '2',
          magic_method_codes: 'IE-IRM:IE-ARM:IE-CHI'
        }]
      };
      return Promise.all([
        upgradeContributionNErrorsTest(_.cloneDeep(jsonOld), 1),
        upgradeContributionErrorTest(_.cloneDeep(jsonOld),
          /row .* in table .* includes more than one type of relative intensity normalization in the method codes/i)
      ]);
    });

  });

  // Test upgrading valid JSON.
  describe('when upgrading valid JSON', function () {

    // Numbers don't get converted from string until schema validation, so make sure they stay as strings for now.
    it('should keep numbers as strings', function () {
      const jsonOld = {
        contribution: [{
          magic_version: '2.5',
          id: '66'
        }]
      };
      const jsonNew = {
        contribution: [{
          data_model_version: '3.0',
          id:'66'
        }]
      };
      return upgradeContributionJSONTest(jsonOld, jsonNew);
    });

    // Tables and columns can change names from one version to the next.
    it('should update table and column names', function () {
      const jsonOld1 = {
        contribution: [{
          magic_version: '2.5'
        }],
        er_specimens: [{
          er_specimen_name: '1'
        }]
      };
      const jsonNew1 = {
        contribution: [{
          data_model_version: '3.0'
        }],
        specimens: [{
          specimen: '1'
        }]
      };
      const jsonOld2 = {
        contribution: [{
          magic_version: '2.5'
        }],
        rmag_susceptibility: [{
          susceptibility_loss_tangent: '1',
          susceptibility_flag: 'g'
        }]
      };
      const jsonNew2 = {
        contribution: [{
          data_model_version: '3.0'
        }],
        specimens: [{
          susc_loss_tangent: '1',
          result_quality: 'g'
        }]
      };
      return Promise.all([
        upgradeContributionJSONTest(jsonOld1, jsonNew1),
        upgradeContributionJSONTest(jsonOld2, jsonNew2)
      ]);
    });

    // Columns could be removed during an upgrade. Make sure the user will be warned about any deletions.
    it('should warn about deleted columns', function () {
      const jsonOld = {
        contribution: [{
          magic_version: '2.5'
        }],
        er_sites: [{
          site_definition: '1'
        }]
      };
      return upgradeContributionWarningTest(jsonOld,
        /column .* in table .* is unnecessary in magic data model/i);
    });

    it('should sort numeric merge keys', function () {
      const jsonOld = {
        contribution: [{
          magic_version: '2.5'
        }],
        er_samples: [{
          er_sample_name: '9'
        },{
          er_sample_name: '10'
        }]
      };
      const jsonNew = {
        contribution: [{
          data_model_version: '3.0'
        }],
        samples: [{
          sample: '9'
        },{
          sample: '10'
        }]
      };
      return upgradeContributionJSONTest(jsonOld, jsonNew);
    });

    it('should warn about guessing the data model version', function () {
      const jsonOld = {
        locations: [{
          location: 'A'
        }],
        measurements: {
          columns: ['number', 'experiment'],
          rows: [
            ['1','A']
          ]
        }
      };
      return upgradeContributionWarningTest(jsonOld, /guessed that the contribution is using/i);
    });

  });

  // Tests specific to a 2.5 to 3.0 upgrade.
  // Some of the logic needed to pass these tests needs to be hard coded for the 2.5 to 3.0 upgrade case.
  // e.g. handling normalized relative intensities and geoids and creating new column types
  describe('when upgrading 2.5 to 3.0', function () {

    describe('when generating warnings and errors', function () {

      // Contribution level results are removed in 3.0. Make sure the user will be warned about any deletions.
      // This can happen in pmag_results or rmag_results.
      it('should warn about deleted results', function () {
        const jsonOld1 = {
          contribution: [{
            magic_version: '2.5'
          }],
          pmag_results: [{
            // These commented out columns would be empty for a contribution level result:
            //er_location_names: '',
            //er_site_names: '',
            //er_sample_names: '',
            //er_specimen_names: '',
            average_int: '1'
          }]
        };
        const jsonOld2 = {
          contribution: [{
            magic_version: '2.5'
          }],
          rmag_results: [{
            critical_temp: '1'
          }]
        };
        return Promise.all([
          upgradeContributionWarningTest(jsonOld1,
            /row .* in table .* was deleted in magic data model/i),
          upgradeContributionWarningTest(jsonOld2,
            /row .* in table .* was deleted in magic data model/i)
        ]);
      });

    });

    describe('when merging rows', function () {

      // pmag_results and rmag_results in 2.5 and older tables had a loose parent/child relationship.
      //
      // For example a pmag_results row like this, which is a result based on a combination of specimens:
      //   er_location_names   er_sites_names   er_sample_names   er_specimens_names    average_intensity
      //   Location1           Site1            Sample1           Specimen1:Specimen2   0.0000068914
      // had a parent record in the er_samples table with er_samples.er_sample_name = Sample1 because the specimens names
      // in this pmag_results row are plural and describe which of Sample1's specimens were included in the result.
      //
      // Whereas a pmag_results row like this:
      //   er_location_names   er_sites_names   er_sample_names   er_specimens_names    average_intensity
      //   Location1           Site1            Sample1           Specimen1             0.0000052143
      //   Location1           Site1            Sample1           Specimen2             0.000005456
      // had a parent record in the er_specimens table with er_specimens.er_specimen_name = Specimen1.
      // Make sure these rows wind up in the right 3.0 tables.
      //
      // The situation above might represent a rock(sample) split into two pieces (specimens) Each specimen was then
      // analyzed separately. The rows with a singular er_specimen_names is considered a specimen.
      // The row with the plural er_specimens_names might represent an average of the two specimens and is considered a sample.
      it('should assign the same column into different tables based on the level', function () {
        const jsonOld = {
          contribution: [{
            magic_version: '2.5'
          }],
          er_samples: [{
            er_sample_name: '1'
          }],
          er_specimens: [{
            er_sample_name: '1',
            er_specimen_name: '3'
          }],
          pmag_results: [{ // this is a sample level result (single sample name)
            er_sample_names: '1',
            er_specimen_names: ':3:1:',
            data_type: 'i',
            magic_method_codes: 'LP-DIR'
          }, { // this is a specimen level result (single specimen name)
            er_sample_names: '1',
            er_specimen_names: '3',
            data_type: 'i',
            magic_method_codes: 'LT-AF-Z'
          }]
        };
        const jsonNew = {
          contribution: [{
            data_model_version: '3.0'
          }],
          samples: [{
            sample: '1',
            specimens: '1:3',
            result_type: 'i',
            method_codes: 'LP-DIR'
          }],
          specimens: [{
            sample: '1',
            specimen: '3',
            result_type: 'i',
            method_codes: 'LT-AF-Z'
          }]
        };
        return upgradeContributionJSONTest(jsonOld, jsonNew);
      });

      // Since many of the parent/child tables in 2.5 and earlier are joined into a single table in 3.0, make sure that
      // these two rows wind up in a single row when possible
      // (i.e. when all columns are either orthogonal or identical)
      // if, in the set of colliding columns (based on the mapping) NOT have different values, then collpase to a single row
      it('should merge orthogonal data from different tables', function () {
        const jsonOld = {
          contribution: [{
            magic_version: '2.5'
          }],
          er_specimens: [{
            er_specimen_name: 'specimen_A',
            specimen_texture: 'Metamorphic'
          }],
          pmag_results: [{
            er_specimen_names: 'specimen_A',
            data_type: 'a'
          }]
        };
        const jsonNew = {
          contribution: [{
            data_model_version: '3.0'
          }],
          specimens: [{ // texture from er_specimens and result_type from pmag_results are orthogonal
            specimen: 'specimen_A',
            texture: 'Metamorphic',
            result_type: 'a'
          }]
        };
        return upgradeContributionJSONTest(jsonOld, jsonNew);
      });
      it('should merge the same column value from different tables', function () {
        const jsonOld = {
          contribution: [{
            magic_version: '2.5'
          }],
          er_sites: [{
            er_site_name: 'site_A',
            site_lat: '1.1'
          }],
          pmag_results: [{
            er_site_names: 'site_A',
            data_type: 'i',
            average_lat: '1.1'
          }]
        };
        const jsonNew = {
          contribution: [{
            data_model_version: '3.0'
          }],
          sites: [{ // lat from er_sites and pmag_results are identical
            site: 'site_A',
            result_type: 'i',
            lat: '1.1'
          }]
        };
        return upgradeContributionJSONTest(jsonOld, jsonNew);
      });

      it('should split rows to avoid a collision.', function () {
        const jsonOld = {
          contribution: [{
            magic_version: '2.5'
          }],
          er_locations: [{
            er_location_name: 'loc_A',
            location_begin_lat: '5',
            location_end_lat: '6'
          }],
          pmag_results: [{
            er_location_names: 'loc_A',
            data_type: 'i',
            normal_inc: '1.2',
            reversed_inc: '1.3',
            result_description: 'A'
          }]
        };
        const jsonNew = {
          contribution: [{
            data_model_version: '3.0'
          }],
          locations: [{
            location: 'loc_A',
            lat_s: '5',
            lat_n: '6',
            result_type: 'i',
            dir_inc: '1.2',
            dir_polarity: 'n',
            description: 'A'
          },{
            location: 'loc_A',
            lat_s: '5',
            lat_n: '6',
            result_type: 'i',
            dir_inc: '1.3',
            dir_polarity: 'r',
            description: 'A'
          }]
        };
        return upgradeContributionJSONTest(jsonOld, jsonNew);
      });

      it('should share some metadata between results.', function () {
        const jsonOld = {
          contribution: [{
            magic_version: '2.5'
          }],
          er_locations: [{
            er_location_name: 'Hyblean Plateau',
            er_location_alternatives: ' Hyblean Plateau Cretaceous Volcanics, Comb. : Hyblean Plateau Miocene Volcanics : Hyblean Plateau Pliocene Volcanics:Hyblean Plateau Cretaceous Volcanics ',
            location_type: 'Outcrop',
            location_begin_lat: '36.8',
            location_begin_lon: '14.7',
            location_end_lat: '37.2',
            location_end_lon: '14.9',
            continent_ocean: 'Europe',
            country: 'Italy',
            region: 'Sicily',
            terrane: 'Sicily',
            geological_province_section: 'Hyblean Plateau Volcanics',
            location_class: 'Extrusive : Intrusive',
            location_lithology: 'Intrusives : Extrusives',
            location_description: 'Underlies Maastrichtian limestones. Superseded study.',
            er_citation_names: 'This study'
          }],
          pmag_results: [{ pmag_result_name: 'Hyblean Plateau Cretaceous Volcanics :1463',
            er_location_names: 'Hyblean Plateau',
            data_type: 'a',
            fold_test: 'ND',
            conglomerate_test: 'ND',
            contact_test: 'ND',
            reversal_test: 'ND',
            rock_magnetic_test: 'ND',
            average_lat: '36.8',
            average_lon: '14.7',
            average_age_low: '71',
            average_age_high: '84',
            average_age_unit: 'Ma',
            average_inc: '-31.2',
            average_dec: '173.6',
            average_alpha95: '7.4',
            average_n: '12',
            average_nn: '74',
            average_k: '36',
            vgp_lat: '69.3',
            vgp_lon: '212.3',
            vgp_dp: '4.6',
            vgp_dm: '8.3',
            tilt_correction: '0',
            percent_reversed: '100',
            result_description: 'AF 22. 5-30mT, thermal 300-400C. Data included in RESULTNO 1464. Superseded study.',
            external_database_names: 'GPMDB',
            external_database_ids: '1463',
            magic_method_codes: ' DE-DI : LT-AF-Z : LT-T-Z:LP-DC3 ',
            er_citation_names: 'This study'
          }, {
            pmag_result_name: 'Hyblean Plateau Cretaceous Volcanics, Comb. :1464',
            er_location_names: 'Hyblean Plateau',
            data_type: 'a',
            fold_test: 'ND',
            conglomerate_test: 'ND',
            contact_test: 'ND',
            reversal_test: 'ND',
            rock_magnetic_test: 'ND',
            average_lat: '36.8',
            average_lon: '14.7',
            average_age_low: '71',
            average_age_high: '84',
            average_age_unit: 'Ma',
            average_inc: '-27.6',
            average_dec: '167.3',
            average_alpha95: '4.3',
            average_n: '52',
            average_nn: '203',
            average_k: '22',
            vgp_lat: '65.2',
            vgp_lon: '225.1',
            vgp_dp: '2.6',
            vgp_dm: '4.7',
            tilt_correction: '0',
            percent_reversed: '100',
            result_description: 'Combined Result. AF and thermal cleaning. Combined RESULTNO 1463, 2367, 2674, 2698. .',
            external_database_names: 'GPMDB',
            external_database_ids: '1464',
            magic_method_codes: ' DE-DI : LT-AF-Z : LT-T-Z:LP-DC3 ',
            er_citation_names: 'This study'
          }]
        };
        const jsonNew = {
          contribution: [{
            data_model_version: '3.0'
          }],
          locations: [{
            age_high: '84',
            age_low: '71',
            age_unit: 'Ma',
            citations: 'This study',
            conglomerate_test: 'ND',
            contact_test: 'ND',
            continent_ocean: 'Europe',
            country: 'Italy',
            description: 'Underlies Maastrichtian limestones. Superseded study. AF 22. 5-30mT, thermal 300-400C. Data included in RESULTNO 1464. Superseded study.',
            dir_alpha95: '7.4',
            dir_dec: '173.6',
            dir_inc: '-31.2',
            dir_k: '36',
            dir_n_samples: '74',
            dir_n_sites: '12',
            dir_tilt_correction: '0',
            external_database_ids: 'GPMDB[1463]',
            fold_test: 'ND',
            geologic_classes: ' Intrusive:Extrusive ',
            geological_province_sections: 'Hyblean Plateau Volcanics',
            lat_n: '37.2',
            lat_s: '36.8',
            lithologies: ' Extrusives:Intrusives ',
            location: 'Hyblean Plateau',
            location_alternatives: ' Hyblean Plateau Cretaceous Volcanics, Comb. : Hyblean Plateau Miocene Volcanics : Hyblean Plateau Pliocene Volcanics:Hyblean Plateau Cretaceous Volcanics ',
            location_type: 'Outcrop',
            lon_e: '14.9',
            lon_w: '14.7',
            method_codes: ' DE-DI : LT-AF-Z : LT-T-Z:LP-DC3 ',
            pole_dm: '8.3',
            pole_dp: '4.6',
            pole_lat: '69.3',
            pole_lon: '212.3',
            pole_reversed_perc: '100',
            region: 'Sicily',
            result_name: 'Hyblean Plateau Cretaceous Volcanics :1463',
            result_type: 'a',
            reversal_test: 'ND',
            rock_magnetic_test: 'ND',
            terranes: 'Sicily'
          }, {
            age_high: '84',
            age_low: '71',
            age_unit: 'Ma',
            citations: 'This study',
            conglomerate_test: 'ND',
            contact_test: 'ND',
            continent_ocean: 'Europe',
            country: 'Italy',
            description: 'Underlies Maastrichtian limestones. Superseded study. Combined Result. AF and thermal cleaning. Combined RESULTNO 1463, 2367, 2674, 2698. .',
            dir_alpha95: '4.3',
            dir_dec: '167.3',
            dir_inc: '-27.6',
            dir_k: '22',
            dir_n_samples: '203',
            dir_n_sites: '52',
            dir_tilt_correction: '0',
            external_database_ids: 'GPMDB[1464]',
            fold_test: 'ND',
            geologic_classes: ' Intrusive:Extrusive ',
            geological_province_sections: 'Hyblean Plateau Volcanics',
            lat_n: '37.2',
            lat_s: '36.8',
            lithologies: ' Extrusives:Intrusives ',
            location: 'Hyblean Plateau',
            location_alternatives: ' Hyblean Plateau Cretaceous Volcanics, Comb. : Hyblean Plateau Miocene Volcanics : Hyblean Plateau Pliocene Volcanics:Hyblean Plateau Cretaceous Volcanics ',
            location_type: 'Outcrop',
            lon_e: '14.9',
            lon_w: '14.7',
            method_codes: ' DE-DI : LT-AF-Z : LT-T-Z:LP-DC3 ',
            pole_dm: '4.7',
            pole_dp: '2.6',
            pole_lat: '65.2',
            pole_lon: '225.1',
            pole_reversed_perc: '100',
            region: 'Sicily',
            result_name: 'Hyblean Plateau Cretaceous Volcanics, Comb. :1464',
            result_type: 'a',
            reversal_test: 'ND',
            rock_magnetic_test: 'ND',
            terranes: 'Sicily'
          }]
        };
        return upgradeContributionJSONTest(jsonOld, jsonNew);
      });

      // Since many of the parent/child tables in 2.5 and earlier are joined into a single table in 3.0, make sure that
      // these two rows are kept separate with repeated information.
      it('should keep different column values separate from different tables', function () {
        const jsonOld1 = {
          contribution: [{
            magic_version: '2.5'
          }],
          er_sites: [{
            er_site_name: 'site_A',
            site_class: 'Submarine:Sedimentary',
            magic_method_codes: 'LP-DIR'
          }],
          rmag_results: [{
            er_site_names: 'site_A',
            anisotropy_type: 'A',
            anisotropy_p: '0.0123',
            magic_method_codes: 'LP-PI'
          }]
        };
        const jsonNew1 = {
          contribution: [{
            data_model_version: '3.0'
          }],
          sites: [{ // method_codes are different, so these rows can't be combined
            site: 'site_A',
            geologic_classes: 'Sedimentary:Submarine', // lists should be normalized by being sorted
            method_codes: 'LP-DIR'
          }, {
            site: 'site_A',
            aniso_type: 'A',
            aniso_p: '0.0123',
            method_codes: 'LP-PI'
          }]
        };
        const jsonOld2 = {
          contribution: [{
            magic_version: '2.5'
          }],
          er_samples: [{
            er_sample_name: 'sample_A',
            er_citation_names: 'This Study'
          }],
          pmag_results: [{
            er_sample_names: 'sample_A',
            average_int: '0.0123',
            data_type: 'i',
            er_citation_names: '10.1029/92JB01202'
          }]
        };
        const jsonNew2 = {
          contribution: [{
            data_model_version: '3.0'
          }],
          samples: [{ // citations are different, so these rows can't be combined
            sample: 'sample_A',
            citations: 'This Study'
          }, {
            sample: 'sample_A',
            int_abs: '0.0123',
            result_type: 'i',
            citations: '10.1029/92JB01202'
          }]
        };
        const jsonOld3 = {
          contribution: [{
            magic_version: '2.5'
          }],
          er_sites: [{
            er_site_name: 'site_A',
            site_lat: '1.1'
          }],
          pmag_results: [{
            er_site_names: 'site_A',
            data_type: 'i',
            average_lat: '1.2'
          }]
        };
        const jsonNew3 = {
          contribution: [{
            data_model_version: '3.0'
          }],
          sites: [{ // lat values are different, so these rows can't be combined
            site: 'site_A',
            lat: '1.1'
          }, {
            site: 'site_A',
            result_type: 'i',
            lat: '1.2'
          }]
        };
        return Promise.all([
          upgradeContributionJSONTest(jsonOld1, jsonNew1),
          upgradeContributionJSONTest(jsonOld2, jsonNew2),
          upgradeContributionJSONTest(jsonOld3, jsonNew3)
        ]);
      });

      it('should merge rows even if lists are in a different order', function () {
        const jsonOld = {
          contribution: [{
            magic_version: '2.5'
          }],
          er_samples: [{
            er_sample_name: 'sample_A',
            sample_class: 'Submarine:Sedimentary',
            magic_method_codes: 'LP-DIR:LP-PI'
          }],
          pmag_results: [{
            er_sample_names: 'sample_A',
            average_int: '0.0123',
            data_type: 'i',
            magic_method_codes: 'LP-PI:LP-DIR'
          }]
        };
        const jsonNew = {
          contribution: [{
            data_model_version: '3.0'
          }],
          samples: [{
            sample: 'sample_A',
            geologic_classes: 'Sedimentary:Submarine',
            int_abs: '0.0123',
            result_type: 'i',
            method_codes: 'LP-DIR:LP-PI'
          }]
        };
        return upgradeContributionJSONTest(jsonOld, jsonNew);
      });

      it('should merge rows when changing tables', function () {
        const jsonOld1 = {
          contribution: [{
            magic_version: '2.5'
          }],
          er_sites: [{
            er_site_name: 'Site 1'
          }],
          er_samples: [{
            er_site_name: 'Site 1',
            er_sample_name: 'Sample 2',
            sample_core_depth: '1'
          },{
            er_site_name: 'Site 1',
            er_sample_name: 'Sample 2'
          }]
        };
        const jsonNew1 = {
          contribution: [{
            data_model_version: '3.0'
          }],
          sites: [{
            site: 'Site 1',
            core_depth: '1' // moved from er_samples table
          }],
          samples: [{
            site: 'Site 1',
            sample: 'Sample 2'
          }]
        };
        const jsonOld2 = {
          contribution: [{
            magic_version: '2.5'
          }],
          er_sites: [{
            er_site_name: 'Site 1',
            site_core_depth: '1'
          }],
          er_samples: [{
            er_site_name: 'Site 1',
            er_sample_name: 'Sample 2',
            sample_core_depth: '2'
          },{
            er_site_name: 'Site 1',
            er_sample_name: 'Sample 2'
          }]
        };
        const jsonNew2 = {
          contribution: [{
            data_model_version: '3.0'
          }],
          sites: [{
            site: 'Site 1',
            core_depth: '2' // moved from er_samples table, but makes a seperate row because of er_sites.site_core_depth
          },{
            site: 'Site 1',
            core_depth: '1'
          }],
          samples: [{
            site: 'Site 1',
            sample: 'Sample 2'
          }]
        };
        return Promise.all([
          upgradeContributionJSONTest(jsonOld1, jsonNew1),
          upgradeContributionJSONTest(jsonOld2, jsonNew2)
        ]);
      });

      it('should merge expeditions with locations', function () {
        const jsonOld1 = {
          contribution: [{
            magic_version: '2.5'
          }],
          er_locations: [{
            er_location_name: 'loc_1'
          }],
          er_expeditions: [{
            er_expedition_name: 'exp_A',
            expedition_ship: 'ship1',
            expedition_mb_sonar: '123'
          }]
        };
        const jsonNew1 = {
          contribution: [{
            data_model_version: '3.0'
          }],
          locations: [{
            location: 'loc_1',
            expedition_name: 'exp_A',
            expedition_ship: 'ship1'
          }]
        };
        const jsonOld2 = {
          contribution: [{
            magic_version: '2.5'
          }],
          er_locations: [{
            er_location_name: 'loc_1'
          },{
            er_location_name: 'loc_2'
          },{
            er_location_name: 'loc_3'
          }],
          er_expeditions: [{
            er_expedition_name: 'exp_A',
            expedition_ship: 'ship1',
            expedition_mb_sonar: '123',
            expedition_location: 'loc_1:loc_2'
          },{
            er_expedition_name: 'exp_B',
            expedition_location: 'loc_3'
          }]
        };
        const jsonNew2 = {
          contribution: [{
            data_model_version: '3.0'
          }],
          locations: [{
            location: 'loc_1',
            expedition_name: 'exp_A',
            expedition_ship: 'ship1'
          },{
            location: 'loc_2',
            expedition_name: 'exp_A',
            expedition_ship: 'ship1'
          },{
            location: 'loc_3',
            expedition_name: 'exp_B'
          }]
        };
        return Promise.all([
          upgradeContributionJSONTest(jsonOld1, jsonNew1),
          upgradeContributionJSONTest(jsonOld2, jsonNew2)
        ]);
      });

    });

    describe('when adding defaults', function () {

      it('should assign a tilt correction for tilt corrected/uncorrected directions', function () {
        const jsonOld = {
          contribution: [{
            magic_version: '2.5'
          }],
          er_samples: [{
            er_sample_name: 'sample_A'
          }],
          pmag_results: [{
            er_sample_names: 'sample_A',
            average_dec: '1',
            magic_method_codes: 'DE-BFL'
          },{
            er_sample_names: 'sample_A',
            tilt_dec_corr: '2',
            magic_method_codes: 'DE-BFL'
          },{
            er_sample_names: 'sample_A',
            tilt_dec_uncorr: '3',
            magic_method_codes: 'DE-BFL'
          }]
        };
        const jsonNew = {
          contribution: [{
            data_model_version: '3.0'
          }],
          samples: [{
            sample: 'sample_A',
            dir_dec: '1',
            dir_tilt_correction: '100', // insert a 100% tilt correction for stratigraphic coordinates
            dir_nrm_origin: 'p',
            dir_polarity: 'n',
            result_type: 'i',
            method_codes: 'DE-BFL'
          },{
            sample: 'sample_A',
            dir_dec: '2',
            dir_tilt_correction: '-3', // insert a -3% tilt correction for unknonwn tilt correction
            dir_nrm_origin: 'p',
            dir_polarity: 'n',
            result_type: 'i',
            method_codes: 'DE-BFL'
          },{
            sample: 'sample_A',
            dir_dec: '3',
            dir_tilt_correction: '0', // insert a 0% tilt correction for uncorrected
            dir_nrm_origin: 'p',
            dir_polarity: 'n',
            result_type: 'i',
            method_codes: 'DE-BFL'
          }]
        };
        return upgradeContributionJSONTest(jsonOld, jsonNew);
      });

      it('should insert the default sample orientation quality of "g" only if there is an orientation', function () {
        const jsonOld = {
          contribution: [{
            magic_version: '2.5'
          }],
          er_samples: [{
            sample_azimuth: 1,
            sample_lat: 1
          },{
            sample_dip: 1,
            sample_lat: 2
          }, {
            sample_bed_dip: 1,
            sample_lat: 3
          }],
        };
        const jsonNew = {
          contribution: [{
            data_model_version: '3.0'
          }],
          samples: [{
            orientation_quality: 'g', // insert default "good" flag because of er_samples.sample_azimuth
            azimuth: 1,
            lat: 1
          },{
            orientation_quality: 'g', // insert default "good" flag because of er_samples.sample_dip
            dip: 1,
            lat: 2
          },{
            orientation_quality: 'g', // insert default "good" flag because of er_samples.sample_bed_dip
            bed_dip: 1,
            lat: 3
          }]
        };
        return upgradeContributionJSONTest(jsonOld, jsonNew);
      });

      it('should preserve sample orientation quality regardless of whether there were orientation data', function () {
        const jsonOld = {
          contribution: [{
            magic_version: '2.5'
          }],
          er_samples: [{
            sample_orientation_flag: 'b'
          }],
        };
        const jsonNew = {
          contribution: [{
            data_model_version: '3.0'
          }],
          samples: [{
            orientation_quality: 'b' // preserve the orientation flag regardless of whether there were orientation data
          }]
        };
        return upgradeContributionJSONTest(jsonOld, jsonNew);
      });

      it('should not insert a default orientation flag without orientation data', function () {
        const jsonOld = {
          contribution: [{
            magic_version: '2.5'
          }],
          er_samples: [{
            sample_cooling_rate: 1
          }],
        };
        const jsonNew = {
          contribution: [{
            data_model_version: '3.0'
          }],
          samples: [{
            cooling_rate: 1 // no orientation flag because there are no orientation data
          }]
        };
        return upgradeContributionJSONTest(jsonOld, jsonNew);
      });

      it('should insert a default result quality', function () {
        const jsonOld = {
          contribution: [{
            magic_version: '2.5'
          }],
          pmag_sites: [{
            er_site_name: 'A'
          }],
          rmag_remanence: [{
            er_specimen_name: 'B'
          }]
        };
        const jsonNew = {
          contribution: [{
            data_model_version: '3.0'
          }],
          sites: [{
            site: 'A',
            result_quality: 'g' // default because of data in pmag_sites
          }],
          specimens: [{
            specimen: 'B',
            result_quality: 'g' // default because of data in rmag_remanence
          }]
        };
        return upgradeContributionJSONTest(jsonOld, jsonNew);
      });

      it('should insert a default result type', function () {
        const jsonOld = {
          contribution: [{
            magic_version: '2.5'
          }],
          pmag_results: [{
            er_sample_names: 'A'
          }]
        };
        const jsonNew = {
          contribution: [{
            data_model_version: '3.0'
          }],
          samples: [{
            sample: 'A',
            result_type: 'i' // default because of data in pmag_results
          }]
        };
        return upgradeContributionJSONTest(jsonOld, jsonNew);
      });

      it('should insert specimen direction default values', function () {
        const jsonOld = {
          contribution: [{
            magic_version: '2.5'
          }],
          pmag_specimens: [{
            specimen_inc: 1,
            specimen_flag: 'g'
          },{
            specimen_inc: 2,
            specimen_flag: 'g',
            magic_method_codes: 'LP-DIR'
          }]
        };
        const jsonNew = {
          contribution: [{
            data_model_version: '3.0'
          }],
          specimens: [{
            dir_inc: 1,
            dir_polarity: 'n', // default "normal" polarity
            dir_nrm_origin: 'p', // default "primary" NRM origin,
            result_quality: 'g',
            method_codes: 'DE-BFL' // default to "determined from a line"
          },{
            dir_inc: 2,
            dir_polarity: 'n', // default "normal" polarity
            dir_nrm_origin: 'p', // default "primary" NRM origin,
            result_quality: 'g',
            method_codes: 'DE-BFL:LP-DIR' // default to "determined from a line"
          }]
        };
        return upgradeContributionJSONTest(jsonOld, jsonNew);
      });

      it('should insert specimen intensity default values', function () {
        const jsonOld = {
          contribution: [{
            magic_version: '2.5'
          }],
          pmag_specimens: [{
            specimen_int: 1,
            specimen_b: 2,
            specimen_flag: 'g'
          }]
        };
        const jsonNew = {
          contribution: [{
            data_model_version: '3.0'
          }],
          specimens: [{
            int_abs: 1,
            int_corr: 'u', // default "uncorrected" estimate
            int_b: 2,
            int_scat: 't', // default "true" that all scatter checks are in the box
            result_quality: 'g'
          }]
        };
        return upgradeContributionJSONTest(jsonOld, jsonNew);
      });

    });

    describe('when reorganizing data', function () {

      it('should separate results with mixtures of tilt corrected/uncorrected directions', function () {
        const jsonOld = {
          contribution: [{
            magic_version: '2.5'
          }],
          er_samples: [{
            er_sample_name: 'sample_A',
            sample_class: 'Submarine:Sedimentary',
          }],
          pmag_results: [{
            er_sample_names: 'sample_A',
            average_inc: '1',
            tilt_dec_corr: '2',
            tilt_correction: '50',
            tilt_inc_uncorr: '3',
            magic_method_codes: 'DE-BFL:LP-PI:LP-DIR'
          }]
        };
        const jsonNew = {
          contribution: [{
            data_model_version: '3.0'
          }],
          samples: [{
            sample: 'sample_A',
            geologic_classes: 'Sedimentary:Submarine',
            dir_inc: '1',
            dir_tilt_correction: '100',
            dir_nrm_origin: 'p',
            dir_polarity: 'n',
            result_type: 'i',
            method_codes: 'DE-BFL:LP-DIR:LP-PI'
          }, {
            sample: 'sample_A',
            geologic_classes: 'Sedimentary:Submarine',
            dir_dec: '2',
            dir_tilt_correction: '50',
            dir_nrm_origin: 'p',
            dir_polarity: 'n',
            result_type: 'i',
            method_codes: 'DE-BFL:LP-DIR:LP-PI'
          }, {
            sample: 'sample_A',
            geologic_classes: 'Sedimentary:Submarine',
            dir_inc: '3',
            dir_tilt_correction: '0',
            dir_nrm_origin: 'p',
            dir_polarity: 'n',
            result_type: 'i',
            method_codes: 'DE-BFL:LP-DIR:LP-PI'
          }]
        };
        return upgradeContributionJSONTest(jsonOld, jsonNew);
      });

      it('should convert a wide pmag_criteria table into a tall criteria table', function () {
        const jsonOld = {
          contribution: [{
            magic_version: '2.5'
          }],
          pmag_criteria: [{
            pmag_criteria_code: 'DE-SITE',
            site_k: '180',
            site_alpha95: '50',
            criteria_definition: 'Criteria for selection of site direction'
          }]
        };
        const jsonNew = {
          contribution: [{
            data_model_version: '3.0'
          }],
          criteria: [{ // this row first because of sorting on criterion, table_column
            description: 'Criteria for selection of site direction',
            criterion: 'DE-SITE',
            table_column: 'sites.dir_alpha95',
            criterion_operation: '<=',
            criterion_value: '50'
          }, {
            description: 'Criteria for selection of site direction',
            criterion: 'DE-SITE',
            table_column: 'sites.dir_k',
            criterion_operation: '>=',
            criterion_value: '180'
          }]
        };
        return upgradeContributionJSONTest(jsonOld, jsonNew);
      });

      it('should convert a good/bad intensity scatter into a true/false', function () {
        const jsonOld = {
          contribution: [{
            magic_version: '2.5'
          }],
          pmag_specimens: [{
            specimen_scat: 'g',
            specimen_flag: 'g'
          }, {
            specimen_scat: 'b',
            specimen_flag: 'b'
          }]
        };
        const jsonNew = {
          contribution: [{
            data_model_version: '3.0'
          }],
          specimens: [{
            int_scat: 't',
            result_quality: 'g'
          }, {
            int_scat: 'f',
            result_quality: 'b'
          }]
        };
        return upgradeContributionJSONTest(jsonOld, jsonNew);
      });

      it('should convert the specimen direction type into a method code', function () {
        const jsonOld = {
          contribution: [{
            magic_version: '2.5'
          }],
          pmag_specimens: [{
            specimen_inc: 1,
            specimen_direction_type: 'l',
            magic_method_codes: 'DE-SITE',
            specimen_flag: 'g'
          },{
            specimen_inc: 2,
            specimen_direction_type: 'p',
            magic_method_codes: 'DE-SITE',
            specimen_flag: 'g'
          },{
            specimen_inc: 3,
            specimen_direction_type: 'p',
            magic_method_codes: 'DE-BFP',
            specimen_flag: 'g'
          },{
            magic_method_codes: 'LP-DIR',
            specimen_flag: 'g'
          }]
        };
        const jsonNew = {
          contribution: [{
            data_model_version: '3.0'
          }],
          specimens: [{
            dir_inc: 1,
            result_quality: 'g',
            dir_polarity: 'n', // default "normal" polarity
            dir_nrm_origin: 'p', // default "primary" NRM origin
            method_codes: 'DE-BFL:DE-SITE' // apply "determined from a line"
          },{
            dir_inc: 2,
            result_quality: 'g',
            dir_polarity: 'n', // default "normal" polarity
            dir_nrm_origin: 'p', // default "primary" NRM origin
            method_codes: 'DE-BFP:DE-SITE' // apply "determined from a plane"
          },{
            dir_inc: 3,
            result_quality: 'g',
            dir_polarity: 'n', // default "normal" polarity
            dir_nrm_origin: 'p', // default "primary" NRM origin
            method_codes: 'DE-BFP' // method code is already included
          },{
            result_quality: 'g',
            method_codes: 'LP-DIR' // not without a pmag_specimens direction
          }]
        };
        return upgradeContributionJSONTest(jsonOld, jsonNew);
      });

      it('should assign the minimum location lat and lon to the correct columns', function () {
        const jsonOld = {
          contribution: [{
            magic_version: '2.5'
          }],
          er_locations: [{
            location_begin_lat: '10',
            location_end_lat: '-10',
            location_begin_lon: '10',
            location_end_lon: '5'
          }]
        };
        const jsonNew = {
          contribution: [{
            data_model_version: '3.0'
          }],
          locations: [{
            lat_s: '-10',
            lat_n: '10',
            lon_w: '5',
            lon_e: '10'
          }]
        };
        return upgradeContributionJSONTest(jsonOld, jsonNew);
      });

      it('should prefer measurement specimen names over synthetic names', function () {
        const jsonOld = {
          contribution: [{
            magic_version: '2.5'
          }],
          magic_measurements: {
            columns: ['er_specimen_name', 'er_synthetic_name'],
            rows: [
              ['a', 'b'],
              ['' , 'b'],
              ['a',  '']
            ]
          }
        };
        const jsonNew = {
          contribution: [{
            data_model_version: '3.0'
          }],
          specimens: [{
            specimen: 'a'
          }, {
            specimen: 'b'
          }],
          measurements: {
            columns: ['specimen'],
            rows: [
              ['a'],
              ['b'],
              ['a']
            ]
          }
        };
        return upgradeContributionJSONTest(jsonOld, jsonNew);
      });

      it('should map measurement synthetic names into specimen names', function () {
        const jsonOld = {
          contribution: [{
            magic_version: '2.5'
          }],
          magic_measurements: {
            columns: ['er_synthetic_name'],
            rows: [
              ['a']
            ]
          }
        };
        const jsonNew = {
          contribution: [{
            data_model_version: '3.0'
          }],
          specimens: [{
            specimen: 'a'
          }],
          measurements: {
            columns: ['specimen'],
            rows: [
              ['a']
            ]
          }
        };
        return upgradeContributionJSONTest(jsonOld, jsonNew);
      });

      xit('should create sample parent tables to avoid losing hierarchy information', function () {
        const jsonOld = {
          contribution: [{
            magic_version: '2.5'
          }],
          er_sites: [{
            er_location_name: 'location name',
            er_site_name: 'site name'
          }],
          er_samples: [{
            er_location_name: 'location name',
            er_site_name: 'site name',
            er_sample_name: 'sample name'
          }]
        };
        const jsonNew = {
          contribution: [{
            data_model_version: '3.0'
          }],
          locations: [{
            location: 'location name'
          }],
          sites: [{
            site: 'site name',
            location: 'location name'
          }],
          samples: [{
            sample: 'sample name',
            site: 'site name'
          }]
        };
        return upgradeContributionJSONTest(jsonOld, jsonNew);
      });

      it('should create measurement parent tables to avoid losing hierarchy information', function () {
        const jsonOld = {
          contribution: [{
            magic_version: '2.5'
          }],
          magic_measurements: {
            columns: ['er_location_name', 'er_site_name', 'er_sample_name', 'er_specimen_name'],
            rows: [
              ['location name', 'site name', 'sample name', 'specimen name']
            ]
          }
        };
        const jsonNew = {
          contribution: [{
            data_model_version: '3.0'
          }],
          locations: [{
            location: 'location name'
          }],
          sites: [{
            site: 'site name',
            location: 'location name'
          }],
          samples: [{
            sample: 'sample name',
            site: 'site name'
          }],
          specimens: [{
            specimen: 'specimen name',
            sample: 'sample name'
          }],
          measurements: {
            columns: ['specimen'],
            rows: [
              ['specimen name']
            ]
          }
        };
        return upgradeContributionJSONTest(jsonOld, jsonNew);
      });

      it('should handle measurements as an array', function () {
        const jsonOld = {
          contribution: [{
            magic_version: '2.5'
          }],
          magic_measurements: {
            columns: ['measurement_date', 'measurement_time_zone'],
            rows: [
              ['2008:07:01:08:46:00.00', 'SAN']
            ]
          }
        };
        const jsonNew = {
          contribution: [{
            data_model_version: '3.0'
          }],
          measurements: {
            columns: ['timestamp'],
            rows: [
              ['2008-07-01T15:46:00Z']
            ]
          }
        };
        return upgradeContributionJSONTest(jsonOld, jsonNew);
      });

      it('should combine external_database_names/ids into a dictionary', function () {
        const jsonOld = {
          contribution: [{
            magic_version: '2.5'
          }],
          pmag_sites: [{
            er_site_name: 'A',
            site_flag: 'g',
            external_database_names: ':GEOMAGIA50:CALS7K.2:ARCHEO00:',
            external_database_ids: '1435::2329'
          }]
        };
        const jsonNew = {
          contribution: [{
            data_model_version: '3.0'
          }],
          sites: [{
            site: 'A',
            result_quality: 'g',
            external_database_ids: 'ARCHEO00[2329]:CALS7K.2[]:GEOMAGIA50[1435]'
          }]
        };
        return upgradeContributionJSONTest(jsonOld, jsonNew);
      });

      it('should use method codes to map normalized relative intensities', function () {
        const jsonOld = {
          contribution: [{
            magic_version: '2.5'
          }],
          pmag_results: [{
            er_site_names: 'site_1',
            average_int_rel: '1',
            average_int_rel_sigma: '2',
            data_type: 'i',
            magic_method_codes: 'something else:ie-ARM'
          }]
        };
        const jsonNew = {
          contribution: [{
            data_model_version: '3.0'
          }],
          sites: [{
            site: 'site_1',
            int_rel_ARM: '1',
            int_rel_ARM_sigma: '2',
            result_type: 'i',
            method_codes: 'SOMETHING ELSE'
          }]
        };
        return upgradeContributionJSONTest(jsonOld, jsonNew);
      });

      it('should add a geoid method code', function () {
        const jsonOld = {
          contribution: [{
            magic_version: '2.5'
          }],
          er_sites: [{
            er_site_name: 'site_1',
            site_location_geoid: 'WGS84'
          }]
        };
        const jsonNew = {
          contribution: [{
            data_model_version: '3.0'
          }],
          sites: [{
            site: 'site_1',
            method_codes: 'GE-WGS84'
          }]
        };
        return upgradeContributionJSONTest(jsonOld, jsonNew);
      });

      it('should rename method codes', function () {
        const jsonOld = {
          contribution: [{
            magic_version: '2.5'
          }],
          er_sites: [{
            er_site_name: 'site_1',
            magic_method_codes: 'ST-BC:ST-BC-Q1:ST-CT:ST-IC:ST-IFC:ST-VV-Q1'
          }]
        };
        const jsonNew = {
          contribution: [{
            data_model_version: '3.0'
          }],
          sites: [{
            site: 'site_1',
            method_codes: 'ST-BCQ-1:ST-C:ST-C-I:ST-G:ST-G-IF:ST-VVQ-1'
          }]
        };
        return upgradeContributionJSONTest(jsonOld, jsonNew);
      });

      it('should favor synthetic name over specimen name', function () {
        const jsonOld = {
          contribution: [{
            magic_version: '2.5'
          }],
          er_samples: [{
            er_sample_name: 'sample1'
          }],
          er_specimens: [{
            er_specimen_name: 'specimen1'
          }, {
            er_specimen_name: 'specimen2'
          }],
          pmag_results: [{
            er_sample_names: 'sample1',
            er_specimen_names: 'specimen1:specimen2',
            average_int: '1'
          }],
          er_synthetics: [{
            er_synthetic_name: 'synthetic1',
            er_specimen_name: 'specimen1'
          }]
        };
        const jsonNew = {
          contribution: [{
            data_model_version: '3.0'
          }],
          samples: [{
            sample: 'sample1',
            specimens: 'specimen2:synthetic1',
            int_abs: '1',
            result_type: 'i'
          }],
          specimens: [{
            specimen: 'specimen2'
          }, {
            specimen: 'synthetic1',
            specimen_alternatives: 'specimen1'
          }]
        };
        return upgradeContributionJSONTest(jsonOld, jsonNew);
      });

      it('should combine pole confidence ellipse parameters', function () {
        const jsonOld = {
          contribution: [{
            magic_version: '2.5'
          }],
          pmag_results: [{
            er_location_names: 'location1',
            eta_dec: '1',
            eta_inc: '2',
            eta_semi_angle: '3',
            zeta_dec: '4',
            zeta_inc: '5',
            zeta_semi_angle: '6'
          }]
        };
        const jsonNew = {
          contribution: [{
            data_model_version: '3.0'
          }],
          locations: [{
            location: 'location1',
            pole_conf: '1:2:3:4:5:6',
            result_type: 'i'
          }]
        };
        return upgradeContributionJSONTest(jsonOld, jsonNew);
      });

      it('should combine the anisotropy tensor elements', function () {
        const jsonOld = {
          contribution: [{
            magic_version: '2.5'
          }],
          rmag_anisotropy: [{
            er_specimen_name: 'specimen1',
            anisotropy_s1: '1',
            anisotropy_s2: '2',
            anisotropy_s3: '3',
            anisotropy_s4: '4',
            anisotropy_s5: '5',
            anisotropy_s6: '6'
          }]
        };
        const jsonNew = {
          contribution: [{
            data_model_version: '3.0'
          }],
          specimens: [{
            specimen: 'specimen1',
            aniso_s: '1:2:3:4:5:6',
            result_quality: 'g'
          }]
        };
        return upgradeContributionJSONTest(jsonOld, jsonNew);
      });

      it('should combine the anisotropy eigenparameters', function () {
        const jsonOld1 = {
          contribution: [{
            magic_version: '2.5'
          }],
          rmag_results: [{
            er_specimen_names: 'specimen1',
            anisotropy_t1: '1',
            anisotropy_v1_dec: '2',
            anisotropy_v1_inc: '3',
            anisotropy_v1_eta_dec: '4',
            anisotropy_v1_eta_inc: '5',
            anisotropy_v1_eta_semi_angle: '6',
            anisotropy_v1_zeta_dec: '7',
            anisotropy_v1_zeta_inc: '8',
            anisotropy_v1_zeta_semi_angle: '9'
          }]
        };
        const jsonNew1 = {
          contribution: [{
            data_model_version: '3.0'
          }],
          specimens: [{
            specimen: 'specimen1',
            aniso_v1: '1:2:3:eta/zeta:4:5:6:7:8:9'
          }]
        };
        const jsonOld2 = {
          contribution: [{
            magic_version: '2.5'
          }],
          rmag_results: [{
            er_specimen_names: 'specimen1',
            anisotropy_t2: '1',
            anisotropy_v2_dec: '2',
            anisotropy_v2_inc: '3'
          }]
        };
        const jsonNew2 = {
          contribution: [{
            data_model_version: '3.0'
          }],
          specimens: [{
            specimen: 'specimen1',
            aniso_v2: '1:2:3'
          }]
        };
        return Promise.all([
          upgradeContributionJSONTest(jsonOld1, jsonNew1),
          upgradeContributionJSONTest(jsonOld2, jsonNew2)
        ]);
      });

      it('should adopt inferred ages up to the sites table', function () {
        const jsonOld1 = {
          contribution: [{
            magic_version: '2.5'
          }],
          er_sites: [{
            er_site_name: 'site1'
          }],
          er_samples: [{
            er_site_name: 'site1',
            er_sample_name: 'sample1'
          }],
          er_specimens: [{
            er_site_name: 'site1',
            er_sample_name: 'sample1',
            er_specimen_name: 'specimen1'
          }],
          pmag_results: [{
            er_site_names: 'site1',
            er_sample_names: 'sample1',
            er_specimen_names: 'specimen1',
            average_age: '1', // -> pmag_specimens.specimen_inferred_age -> pmag_samples.sample_inferred_age  -> pmag_sites.site_inferred_age
            average_age_low: '0',
            average_age_high: '2'
          }]
        };
        const jsonNew1 = {
          contribution: [{
            data_model_version: '3.0'
          }],
          sites: [{
            site: 'site1',
            age: '1',
            age_low: '0',
            age_high: '2'
          }],
          samples: [{
            site: 'site1',
            sample: 'sample1'
          }],
          specimens: [{
            sample: 'sample1',
            specimen: 'specimen1',
            result_type: 'i'
          }]
        };
        return upgradeContributionJSONTest(jsonOld1, jsonNew1);
      });

      it('should repeat metadata', function () {
        const jsonOld = {
          contribution: [{
            magic_version: '2.5'
          }],
          er_specimens: [{
            er_specimen_name: 'specimen1',
            specimen_lithology: 'Basalt'
          }],
          pmag_specimens: [{
            er_specimen_name: 'specimen1',
            specimen_mad: '1'
          }, {
            er_specimen_name: 'specimen1',
            specimen_mad: '2'
          }]
        };
        const jsonNew = {
          contribution: [{
            data_model_version: '3.0'
          }],
          specimens: [{
            specimen: 'specimen1',
            lithologies: 'Basalt',
            result_quality: 'g',
            dir_mad_free: '1'
          }, {
            specimen: 'specimen1',
            lithologies: 'Basalt',
            result_quality: 'g',
            dir_mad_free: '2'
          }]
        };
        return upgradeContributionJSONTest(jsonOld, jsonNew);
      });

      it('should combine descriptions without repetition', function () {
        const jsonOld = {
          contribution: [{
            magic_version: '2.5'
          }],
          pmag_results: [{
            er_site_names: 'site1',
            pmag_result_name: 'name',
            result_description: 'a name'
          },{
            er_site_names: 'site2',
            pmag_result_name: 'name1',
            result_description: 'a name'
          }]
        };
        const jsonNew = {
          contribution: [{
            data_model_version: '3.0'
          }],
          sites: [{
            site: 'site1',
            description: 'a name',
            result_type: 'i'
          },{
            site: 'site2',
            description: 'name1, a name',
            result_type: 'i'
          }]
        };
        return upgradeContributionJSONTest(jsonOld, jsonNew);
      });

      it('should convert dates into ISO 8601 timestamps', function () {
        const jsonOld = {
          contribution: [{
            magic_version: '2.5'
          }],
          er_samples: [{
            sample_date: '2008:07:01:08:46:00.00',
            sample_time_zone: 'SAN'
          },{
            sample_date: '2008:07:01:08:46:00.00'
          },{
            sample_time_zone: 'SAN'
          }]
        };
        const jsonNew = {
          contribution: [{
            data_model_version: '3.0'
          }],
          samples: [{
            timestamp: '2008-07-01T15:46:00Z'
          },{
            timestamp: '2008-07-01T08:46:00Z'
          }]
        };
        return upgradeContributionJSONTest(jsonOld, jsonNew);
      });

      // TODO: create a rotation matrix, even though they haven't been used properly yet
      /*it('should create a rotation matrix', function () {
       const jsonOld = {
       contribution: [{
       magic_version: '2.5'
       }],
       er_specimens: [{
       er_specimen_name: 'specimen1'
       }],
       pmag_specimens: [{
       er_specimen_names: 'specimen1',
       pmag_rotation_codes: 'code1:code2'
       }],
       pmag_rotations: [{
       pmag_rotation_codes: 'code1',
       er_specimen_name: 'specimen1'
       }]
       };
       const jsonNew = {
       contribution: [{
       data_model_version: '3.0'
       }],
       specimens: [{
       specimen: 'synthetic1',
       specimen_alternatives: 'specimen1'
       }]
       };
       upgradeContributionJSONTest(jsonOld, jsonNew);
       });

       it('should warn about parsing an empty string', function () {
       const jsonOld = {
       contribution: [{
       data_model_version: '2.5'
       }],
       er_specimens: [{
       er_specimen_name: 'sp1'
       }],
       pmag_results: [{
       er_location_names: 'lo1',
       er_site_names: 'si1',
       er_sample_names: 'sa1',
       er_specimen_names: 'sp1',
       pmag_rotation_codes: 'code1:code2'
       }],
       pmag_rotations: [{
       pmag_rotation_code: 'code1'
       }]
       };
       return upgradeContributionWarningTest(jsonOld, /pmag_rotations/i);
       });*/

      // TODO: reference to DOI, might need to export er_citation_ids to avoid losing DOIs in upgrades

      // TODO: user to handle
    });

  });

  // Test upgrading valid files.
  describe('when upgrading valid files', function () {
    xit('should upgrading contribution 10507 (MagIC version 2.5) with no errors', function () {
      const parser = new ParseContribution({});
      return parser.parsePromise({text: contribution10507}).then(() => upgradeContributionNoErrorTest(parser.json));
    });
  });
  
  // Test calculating the upgrade map.
  describe('when calculating the upgrade map', function () {
    it('should handle renamed tables', function () {
      const newModel = {//indicates that table "er_locations" has been changed to "locations"
        tables: { locations: {
          columns: { location_name: {
            previous_columns: [{
              table: 'er_locations',
              column: 'location_name'
            }]
          }}
        }}
      };
      const upgradeMap = {
        er_locations: { location_name: [{ table: 'locations', column: 'location_name'}]}//the map from the old model to the new
      };
      upgradeContributionCreateMapTest(newModel, upgradeMap);
    });

    it('should handle multiple columns', function () {
      const newModel = {
        'data_model_version': '3.0',
        'tables': {
          'contribution': {
            'label': 'Contribution',
            'position': 1,
            'description': 'Contribution metadata',
            'columns': {
              'id': {
                'label': 'Contribution ID',
                'group': 'Contribution',
                'position': 1,
                'type': 'Integer',
                'description': 'Unique MagIC Contribution ID, Download Only, written during contribution activation',
                'examples': ['5412'],
                'validations': ['downloadOnly()'],
                'previous_columns': [{
                  'table': 'contribution',
                  'column': 'id'
                }]
              },
              'version': {
                'label': 'Version',
                'group': 'Contribution',
                'position': 2,
                'type': 'Integer',
                'description': 'Contribution version number, Download Only, written during contribution activation',
                'notes': '1 for original contribution, 6 for latest contribution if there are 6 versions, empty if the contribution is not activated',
                'validations': ['downloadOnly()'],
                'previous_columns': [{
                  'table': 'contribution',
                  'column': 'version'
                }]
              }
            }//end columns
      }}};
      const upgradeMap = {
        contribution: {
          id:     [{ table: 'contribution', column: 'id'}],
          version:[{ table: 'contribution', column: 'version'}]
        }

      };
      upgradeContributionCreateMapTest(newModel, upgradeMap);
    });

    it('should handle inserted columns', function () {
      const newModel = {
        tables: { er_locations: {
          columns: { location_name: {}}
        }}
      };
      const upgradeMap = {};
      upgradeContributionCreateMapTest(newModel, upgradeMap);
    });

    //If a the current column name is different than the previous column name on a one to one basis. By contrast, multiple columns with
    //the same previous column indicate that a split was made from the previous version
    it('should handle renamed columns', function () {
      const newModel = {//indicates that column er_locations.name has been changed  to er_locations.location_name
        tables: { er_locations: {
          columns: { location_name: {
            previous_columns: [{
              table: 'er_locations',
              column: 'name'
            }]
          }}
        }}
      };
      const upgradeMap  = {
        er_locations: { name: [{ table: 'er_locations', column: 'location_name'}]}//from the previous table and column to new table and column
      };
      upgradeContributionCreateMapTest(newModel, upgradeMap);
    });

    //If there are two columns with different names that have the same previous table and previous column name, we have a split
    it('should handle split columns', function () {
      const newModel = {
        tables: { er_locations: {
          columns: {
            location_name1: {
              previous_columns: [{
                table: 'er_locations',
                column: 'splitColName'
              }]
            },
            location_name2: {
              previous_columns: [{
                table: 'er_locations',
                column: 'splitColName'
              }]
            }
          }
        }}
      };
      const upgradeMap = {
        er_locations: {
          splitColName: [
            { table: 'er_locations', column: 'location_name1'},
            { table: 'er_locations', column: 'location_name2'}
          ]
        }
      };
      upgradeContributionCreateMapTest(newModel, upgradeMap);
    });

    it('should handle merged columns', function () {
      const newModel = {
        tables: { er_locations: {
          columns: { location_name: {
            previous_columns: [{
              table: 'er_locations',
              column: 'col_name1'
            }, {
              table: 'er_locations',
              column: 'col_name2'
            }]
          }}
        }}
      };
      const upgradeMap = {
        er_locations: {//the table in the new model
          col_name1: [{ table: 'er_locations', column: 'location_name'}],//from previous column (old JSON) TO new table and column
          col_name2: [{ table: 'er_locations', column: 'location_name'}] //from previous column (old JSON) TO new table and column
        }
      };
      upgradeContributionCreateMapTest(newModel, upgradeMap);
    });

  });
});

// Expect the warnings to contain one warning that matches the reWarningMsg regex.
const upgradeContributionWarningTest = (jsonOld, reWarningMsg) => {
  const upgrader = new UpgradeContribution({});
  //let runnerState = upgrader.runnerState;
  //const validator1 = new ValidateContribution({runnerState});
  //const validator2 = new ValidateContribution({});
  //validator1.getVersion(jsonOld);
  return upgrader.upgradePromise({json: jsonOld}).then(() => {
    expect(upgrader.warnings().length).to.be.at.least(1);
    expect(_.find(upgrader.warnings(), warning => warning.message.match(reWarningMsg))).to.not.be.undefined;
  });
};

// Expect the last error to match the reErrorMsg regex.
const upgradeContributionErrorTest = (jsonOld, reErrorMsg) => {
  const upgrader = new UpgradeContribution({});
  return upgrader.upgradePromise({json: jsonOld}).then(() => {
    expect(upgrader.errors().length).to.be.at.least(1);
    expect(_.find(upgrader.errors(), error => error.message.match(reErrorMsg))).to.not.be.undefined;
  });
};

const upgradeContributionNErrorsTest = (jsonOld, nErrors) => {
  const upgrader = new UpgradeContribution({});
  return upgrader.upgradePromise({json: jsonOld}).then(() => {
    expect(upgrader.errors().length).to.equal(nErrors);
  });
};

// Expect no errors.
const upgradeContributionNoErrorTest = (jsonOld) => {
  const upgrader = new UpgradeContribution({});
  return upgrader.upgradePromise({json: jsonOld}).then(() => {
    expect(upgrader.errors().length).to.equal(0);
  });
};

// Expect no errors and check against expected JSON.
const upgradeContributionJSONTest = (jsonOld, jsonExpected) => {
  const upgrader = new UpgradeContribution({});
  return upgrader.upgradePromise({json: jsonOld}).then(() => {
    expect(upgrader.errors().length).to.equal(0);
    expect(upgrader.json).to.deep.equal(jsonExpected);
  });
};

// Expect no errors and check the upgrade map against expected map.
const upgradeContributionCreateMapTest = (newModel, expectedMap) => {
  const upgrader = new UpgradeContribution({});
  const upgradeMap = upgrader.getUpgradeMap(newModel);
  expect(upgradeMap).to.deep.equal(expectedMap);
  expect(upgrader.warnings().length).to.equal(0);
  expect(upgrader.errors().length).to.equal(0);
};