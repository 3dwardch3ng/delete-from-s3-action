import * as core from '@actions/core';
import * as S3 from '@aws-sdk/client-s3';
import { ListObjectsV2Request } from '@aws-sdk/client-s3/dist-types/models/models_0';
import { DeleteObjectsCommandInput } from '@aws-sdk/client-s3/dist-types/commands/DeleteObjectsCommand';
import * as types from '@smithy/types';

const INPUT_AWS_ACCESS_KEY_ID = core.getInput('aws_access_key_id', {
  required: false,
});
const INPUT_AWS_SECRET_ACCESS_KEY = core.getInput('aws_secret_access_key', {
  required: false,
});
const BUCKET = core.getInput('aws_bucket_name', {
  required: true,
});
const BUCKET_REGION = core.getInput('aws_bucket_region', {
  required: true,
});
const IS_FULL_MATCH =
  core.getInput('is_full_match', {
    required: false,
  }) || 'true';
const IS_ANY_MATCH =
  core.getInput('is_any_match', {
    required: false,
  }) || 'false';
const IS_PREFIX_MATCH =
  core.getInput('is_prefix_match', {
    required: false,
  }) || 'false';
const IS_SUFFIX_MATCH =
  core.getInput('is_suffix_match', {
    required: false,
  }) || 'false';
const OBJECT_NAME_TO_DELETE = core.getInput('object_name_to_delete', {
  required: true,
});
const DRY_RUN =
  core.getInput('dry-run', {
    required: false,
  }) || 'false';

let s3Options: types.CheckOptionalClientConfig<S3.S3ClientConfig>;
let s3Client: S3.S3Client;

const init = (): void => {
  if (INPUT_AWS_ACCESS_KEY_ID !== '' && INPUT_AWS_SECRET_ACCESS_KEY !== '') {
    core.debug('Using AWS credentials from input');
    s3Options = [
      {
        region: BUCKET_REGION,
        endpoint: `https://${BUCKET}.s3.${BUCKET_REGION}.amazonaws.com`,
        credentials: {
          accessKeyId: INPUT_AWS_ACCESS_KEY_ID,
          secretAccessKey: INPUT_AWS_SECRET_ACCESS_KEY,
        },
      },
    ];
    s3Client = new S3.S3Client(s3Options);
  } else {
    core.debug('Using AWS credentials from environment');
  }
};

const deletedCommandInput: DeleteObjectsCommandInput = {
  Bucket: BUCKET,
  Delete: { Objects: [] },
};
const deleteCommand = new S3.DeleteObjectsCommand(deletedCommandInput);

const listObjects = async (
  callback1: (
    objects: S3._Object[],
    callback: (key?: string) => void,
  ) => object,
  callback2: (key?: string) => void,
): Promise<void> => {
  const listRequest: ListObjectsV2Request = {
    Bucket: BUCKET,
  };

  if (IS_PREFIX_MATCH === 'true') {
    listRequest.Prefix = OBJECT_NAME_TO_DELETE;
  }

  const listCommand: S3.ListObjectsV2Command = new S3.ListObjectsV2Command(
    listRequest,
  );

  const response: S3.ListObjectsV2Output = await s3Client.send(listCommand);

  if (!response.Contents || response.Contents?.length === 0) return;

  if (callback1) {
    callback1(response.Contents, callback2);
  }

  if (response.IsTruncated) {
    await listObjects(callback1, callback2);
  }
};

const processObjectsFunc = async (
  objects: S3._Object[],
  callback: (objectKey?: string) => void,
): Promise<void> => {
  for (const object of objects) {
    if (objectKeyMatches(object.Key)) {
      callback(object.Key);
    }
  }
};

const objectKeyMatches = (objectKey: string | undefined): boolean => {
  if (!objectKey) return false;

  if (IS_FULL_MATCH === 'true') {
    return objectKey === OBJECT_NAME_TO_DELETE;
  } else if (IS_ANY_MATCH === 'true') {
    return objectKey.includes(OBJECT_NAME_TO_DELETE);
  } else if (IS_PREFIX_MATCH === 'true') {
    return objectKey.startsWith(OBJECT_NAME_TO_DELETE);
  } else if (IS_SUFFIX_MATCH === 'true') {
    return objectKey.endsWith(OBJECT_NAME_TO_DELETE);
  }
  return false;
};

const processObjectToDelete = (objectKey?: string): void => {
  if (objectKey) {
    if (DRY_RUN === 'true') {
      core.info(`Would delete object: ${objectKey}`);
    } else {
      deletedCommandInput.Delete?.Objects?.push({ Key: objectKey });
    }
  }
};

const deleteObjects = async (): Promise<void> => {
  await listObjects(processObjectsFunc, processObjectToDelete);

  if (deletedCommandInput.Delete?.Objects?.length === 0) {
    core.info('No objects to delete');
    return;
  }

  const { Deleted } = await s3Client.send(deleteCommand);

  if (!Deleted) return;

  core.info(
    `Successfully deleted ${Deleted?.length} objects from S3 bucket. Deleted objects:`,
  );

  core.info(Deleted?.map((d) => ` • ${d.Key}`).join('\n'));
};

try {
  init();
  deleteObjects();
} catch (error) {
  core.setFailed(`Action failed with error ${error}`);
}
