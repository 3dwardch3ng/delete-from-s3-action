# delete-from-s3-action
This is the Github Action that delete object/s from a S3 bucket

### Status
![GitHub](https://img.shields.io/github/license/3dwardch3ng/delete-from-s3-action)
![GitHub release (with filter)](https://img.shields.io/github/v/release/3dwardch3ng/delete-from-s3-action)
![GitHub contributors](https://img.shields.io/github/contributors/3dwardch3ng/delete-from-s3-action)
#### Release 
![CI](https://github.com/3dwardCh3nG/delete-from-s3-action/actions/workflows/ci.yml/badge.svg?branch=main)
[![Qodana](https://github.com/3dwardCh3nG/delete-from-s3-action/actions/workflows/qodana_code_quality.yml/badge.svg?branch=main)](https://github.com/3dwardCh3nG/delete-from-s3-action/actions/workflows/qodana_code_quality.yml)
[![GitHub Super-Linter](https://github.com/3dwardCh3nG/delete-from-s3-action/actions/workflows/linter.yml/badge.svg?branch=main)](https://github.com/super-linter/super-linter)
#### Next 
![CI](https://github.com/3dwardCh3nG/delete-from-s3-action/actions/workflows/ci.yml/badge.svg?branch=next)
[![Qodana](https://github.com/3dwardCh3nG/delete-from-s3-action/actions/workflows/qodana_code_quality.yml/badge.svg?branch=next)](https://github.com/3dwardCh3nG/delete-from-s3-action/actions/workflows/qodana_code_quality.yml)
[![GitHub Super-Linter](https://github.com/3dwardCh3nG/delete-from-s3-action/actions/workflows/linter.yml/badge.svg?branch=next)](https://github.com/super-linter/super-linter)
#### Develop 
![CI](https://github.com/3dwardCh3nG/delete-from-s3-action/actions/workflows/ci.yml/badge.svg?branch=develop)
[![Qodana](https://github.com/3dwardCh3nG/delete-from-s3-action/actions/workflows/qodana_code_quality.yml/badge.svg?branch=develop)](https://github.com/3dwardCh3nG/delete-from-s3-action/actions/workflows/qodana_code_quality.yml)
[![GitHub Super-Linter](https://github.com/3dwardCh3nG/delete-from-s3-action/actions/workflows/linter.yml/badge.svg?branch=develop)](https://github.com/super-linter/super-linter)
[![Dependency Review](https://github.com/3dwardCh3nG/delete-from-s3-action/actions/workflows/dependency-review.yml/badge.svg)](https://github.com/3dwardCh3nG/delete-from-s3-action/actions/workflows/dependency-review.yml)
![Unit Test](badges/coverage.svg)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=3dwardCh3nG_delete-from-s3-action&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=3dwardCh3nG_delete-from-s3-action)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=3dwardCh3nG_delete-from-s3-action&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=3dwardCh3nG_delete-from-s3-action)
[![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=3dwardCh3nG_delete-from-s3-action&metric=sqale_index)](https://sonarcloud.io/summary/new_code?id=3dwardCh3nG_delete-from-s3-action)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=3dwardCh3nG_delete-from-s3-action&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=3dwardCh3nG_delete-from-s3-action)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=3dwardCh3nG_delete-from-s3-action&metric=bugs)](https://sonarcloud.io/summary/new_code?id=3dwardCh3nG_delete-from-s3-action)

## Usage

### `workflow.yml` Example

Place in a `.yml` file such as this one in your `.github/workflows` folder. [Refer to the documentation on workflow YAML syntax here.](https://help.github.com/en/articles/workflow-syntax-for-github-actions)

```yaml
name: Delete from S3

on:
  push:
    branches:
      - master

jobs:
  delete-s3:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@master
    - uses: 3dwardCh3nG/delete-from-s3-action@v1.0.0
      with:
        aws_access_key_id: ${{ secrets.AWS_KEY_ID }}
        aws_secret_access_key: ${{ secrets.AWS_SECRET_ACCESS_KEY}}
        aws_bucket_name: 'my-bucket'
        aws_bucket_region: 'ap-southeast-2'
        object_key_to_delete: 's3/bucket/path/to/delete.txt'
```

## Action inputs
Please follow below to see all the inputs for the action.

| name                               | description                                                                                                                           | Default Value                                                                                                                                        |
|------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------|
| `aws_access_key_id`                | (Optional) AWS Access Key ID                                                                                                          | When empty, it will use value AWS_ACCESS_KEY_ID from the environment variable.                                                                       |
| `aws_secret_access_key`            | (Optional) AWS Secret Access Key                                                                                                      | When empty, it will use value AWS_SECRET_ACCESS_KEY from the environment variable.                                                                   |
| `aws_bucket_name`                  | AWS S3 Bucket Name                                                                                                                    |                                                                                                                                                      |
| `aws_bucket_region`                | AWS S3 Bucket Region                                                                                                                  |                                                                                                                                                      |
| `is_full_match`                    | (Optional) The flag of if the input object_key_to_delete value matches the exact object key of the object in the bucket               | Default value: true                                                                                                                                  |
| `is_any_match`                     | (Optional) The flag of if the input object_key_to_delete value matches the any part of the object keys of the objects in the bucket   | Default value: false                                                                                                                                 |
| `is_prefix_match`                  | (Optional) The flag of if the input object_key_to_delete value matches the prefix of the object keys of the objects in the bucket     | Default value: false                                                                                                                                 |
| `is_suffix_match`                  | (Optional) The flag of if the input object_key_to_delete value matches the suffix of the object keys of the objects in the bucket     | Default value: false                                                                                                                                 |
| `object_key_to_delete`             | the (partial) object key to match the objects in the bucket                                                                           | The (partial) object key you want to use to match the objects in the bucket, matched object will be deleted.                                         |
| `dry_run`                          | (Optional) The falg of the Dry Run mode                                                                                               | Default value: false. In the dry run mode, it will only display the object keys of the objects will be deleted. No object will be actually deleted.  |

## Logs
In order to enable to debug logs, you need to enable to Step Debug Logs by setting the secret `ACTIONS_STEP_DEBUG` to `true`. (see: [Step Debug Logs](https://github.com/actions/toolkit/blob/master/docs/action-debugging.md#step-debug-logs))