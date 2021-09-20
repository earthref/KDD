import CommonMethods from './common';
import KdDMethods from './kdd';
import ElasticSearchMethods from './es';
import S3SearchMethods from './s3';

export default function () {
  CommonMethods();
  KdDMethods();
  ElasticSearchMethods();
  S3SearchMethods();
}