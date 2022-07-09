let levels = [
  { name: 'Contributions' },
  { name: 'Partition Coefficients'     }
];

let index = 'kdd';

levels[0].views = [ { name: 'Summaries', es: { index: index, type: 'contribution' , source: {excludes: ['*.vals'], includes: ['summary._incomplete_summary', 'summary.contribution.*', 'summary.kds.*', 'summary._all.*']} }} ];
levels[1].views = [ //{ name: 'Summaries', es: { index: index, type: 'kds'          , source: {excludes: ['*.vals'], includes: ['summary._incomplete_summary', 'summary.contribution.*', 'summary.kds.*', 'summary._all.*']} }}, 
                    { name: 'Rows'     , es: { index: index, type: 'kds'          , source: {excludes: ['*.vals'], includes: ['summary._incomplete_summary', 'summary.contribution.*', 'summary.kds.*', 'summary._all.*']} }} ];

export {levels, index};