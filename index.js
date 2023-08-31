const core = require('@actions/core');
const {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand
} = require('@aws-sdk/client-s3');

const INPUT_AWS_ACCESS_KEY_ID = core.getInput('aws_access_key_id', {
  required: false
});
const INPUT_AWS_SECRET_ACCESS_KEY = core.getInput('aws_secret_access_key', {
  required: false
});
const BUCKET = core.getInput('aws_bucket_name', {
  required: true
});
const BATCH_SIZE = core.getInput('aws_bucket_object_search_batch_size', {
  required: false
});
const IS_FULL_MATCH = core.getInput('is_full_match', {
  required: false
}) || 'true';
const IS_ANY_MATCH = core.getInput('is_any_match', {
  required: false
}) || 'false';
const IS_PREFIX_MATCH = core.getInput('is_prefix_match', {
  required: false
}) || 'false';
const IS_SUFFIX_MATCH = core.getInput('is_suffix_match', {
  required: false
}) || 'false';
const OBJECT_NAME_TO_DELETE = core.getInput('object_name_to_delete', {
  required: true
})
const DRY_RUN = core.getInput('dry-run', {
  required: false
}) || 'false';

let s3Options = {};
if (INPUT_AWS_ACCESS_KEY_ID !== '' && INPUT_AWS_SECRET_ACCESS_KEY !== '') {
  core.debug('Using AWS credentials from input');
  s3Options['accessKeyId'] = INPUT_AWS_ACCESS_KEY_ID;
  s3Options['secretAccessKey'] = INPUT_AWS_SECRET_ACCESS_KEY;
} else {
  core.debug('Using AWS credentials from environment');
}

const s3Client = new S3Client(s3Options);

const listCommand = new ListObjectsV2Command({
  Bucket: BUCKET
});

const deleteCommand = new DeleteObjectsCommand({
  Bucket: BUCKET,
  Delete: { Objects: [] }
});

const listObjects = async function listObjects(callback1, callback2) {
  if (BATCH_SIZE !== '') {
    listCommand.MaxKeys = BATCH_SIZE;
  }

  if (IS_PREFIX_MATCH === 'true') {
    listCommand.Prefix = OBJECT_NAME_TO_DELETE;
  }

  const response = await s3Client.send(listCommand);

  if (response.Contents.length === 0) return;

  if (callback1) {
    callback1(response.Contents, callback2);
  }

  if (response.IsTruncated) {
    await listObjects(callback1, callback2);
  }
}

const processObjectsFunc = async function processObjects(objects, callback) {
  for (const object of objects) {
    if (objectKeyMatches(object.Key)) {
      callback(object.Key);
    }
  }
}

const objectKeyMatches = function objectKeyMatches(objectKey) {
  if (IS_FULL_MATCH === 'true') {
    return objectKey === OBJECT_NAME_TO_DELETE;
  } else if (IS_ANY_MATCH === 'true') {
    return objectKey.includes(OBJECT_NAME_TO_DELETE);
  } else if (IS_PREFIX_MATCH === 'true') {
    return objectKey.startsWith(OBJECT_NAME_TO_DELETE);
  } else if (IS_SUFFIX_MATCH === 'true') {
    return objectKey.endsWith(OBJECT_NAME_TO_DELETE);
  }
}

const processObjectToDelete = function processObjectToDelete(objectKey) {
  if (DRY_RUN === 'true') {
    core.info(`Would delete object: ${objectKey}`);
  } else {
    deleteCommand.Delete.Objects.push({ Key: objectKey });
  }
}

function deleteObjects() {
  listObjects(processObjectsFunc, processObjectToDelete).then((success, err) => {
    if (err) {
      core.error(err);
      throw err;
    }

    if (deleteCommand.Delete.Objects.length === 0) {
      core.info('No objects to delete');
      return;
    }

    s3Client.send(deleteCommand).then(({ Deleted }, success, err) => {
      if (err) {
        core.error(err);
        throw err;
      }

      core.info(
        `Successfully deleted ${Deleted.length} objects from S3 bucket. Deleted objects:`
      );

      core.info(Deleted.map((d) => ` • ${d.Key}`).join("\n"));
    });
  });
}

try {
  deleteObjects();
} catch (error) {
  core.setFailed(`Action failed with error ${error}`);
}