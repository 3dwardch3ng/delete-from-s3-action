# delete-from-s3-action
This is the Github Action that delete object/s from a S3 bucket

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
        aws_bucket_name: ${{ secrets.AWS_BUCKET }}
        is_full_match: false
        is_any_match: true
```

## Action inputs
Please follow below to see all the inputs for the action.
