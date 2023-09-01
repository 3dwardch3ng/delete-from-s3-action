# delete-from-s3-action
This is the Github Action that delete object/s from a S3 bucket

## Status
### Release 
![CI](https://github.com/3dwardCh3nG/delete-from-s3-action/actions/workflows/release.yml/badge.svg?branch=main)
[![Qodana](https://github.com/3dwardCh3nG/delete-from-s3-action/actions/workflows/qodana_code_quality.yml/badge.svg?branch=main)](https://github.com/3dwardCh3nG/delete-from-s3-action/actions/workflows/qodana_code_quality.yml)
[![GitHub Super-Linter](https://github.com/3dwardCh3nG/delete-from-s3-action/actions/workflows/linter.yml/badge.svg?branch=main)](https://github.com/super-linter/super-linter)
### Next 
![CI](https://github.com/3dwardCh3nG/delete-from-s3-action/actions/workflows/pre-release.yml/badge.svg?branch=next)
[![Qodana](https://github.com/3dwardCh3nG/delete-from-s3-action/actions/workflows/qodana_code_quality.yml/badge.svg?branch=next)](https://github.com/3dwardCh3nG/delete-from-s3-action/actions/workflows/qodana_code_quality.yml)
[![GitHub Super-Linter](https://github.com/3dwardCh3nG/delete-from-s3-action/actions/workflows/linter.yml/badge.svg?branch=next)](https://github.com/super-linter/super-linter)
### Develop 
![CI](https://github.com/3dwardCh3nG/delete-from-s3-action/actions/workflows/develop.yml/badge.svg?branch=develop)
[![Qodana](https://github.com/3dwardCh3nG/delete-from-s3-action/actions/workflows/qodana_code_quality.yml/badge.svg?branch=develop)](https://github.com/3dwardCh3nG/delete-from-s3-action/actions/workflows/qodana_code_quality.yml)
[![GitHub Super-Linter](https://github.com/3dwardCh3nG/delete-from-s3-action/actions/workflows/linter.yml/badge.svg?branch=develop)](https://github.com/super-linter/super-linter)
![Unit Test](badges/coverage.svg)

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
  upload:
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
