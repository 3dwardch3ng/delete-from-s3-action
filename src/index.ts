import * as core from '@actions/core';
import * as S3 from '@aws-sdk/client-s3';
import { ListObjectsV2Request } from '@aws-sdk/client-s3/dist-types/models/models_0';
import { DeleteObjectsCommandInput } from '@aws-sdk/client-s3/dist-types/commands/DeleteObjectsCommand';
import * as types from '@smithy/types';

const inputData: InputData = {} as InputData;
const s3Data: S3Data = {} as S3Data;

export const prepareInputValues = (): void => {
  inputData.INPUT_AWS_ACCESS_KEY_ID = core.getInput('aws_access_key_id', {
    required: false,
  });
  inputData.INPUT_AWS_SECRET_ACCESS_KEY = core.getInput(
    'aws_secret_access_key',
    {
      required: false,
    },
  );
  inputData.BUCKET = core.getInput('aws_bucket_name', { required: true });
  inputData.BUCKET_REGION = core.getInput('aws_bucket_region', {
    required: true,
  });
  inputData.IS_FULL_MATCH =
    core.getInput('is_full_match', { required: false }) || 'true';
  inputData.IS_ANY_MATCH =
    core.getInput('is_any_match', { required: false }) || 'false';
  inputData.IS_PREFIX_MATCH =
    core.getInput('is_prefix_match', { required: false }) || 'false';
  inputData.IS_SUFFIX_MATCH =
    core.getInput('is_suffix_match', { required: false }) || 'false';
  inputData.OBJECT_KEY_TO_DELETE = core.getInput('object_key_to_delete', {
    required: true,
  });
  inputData.DRY_RUN = core.getInput('dry_run', { required: false }) || 'false';
};

export const init = (): void => {
  if (
    inputData.INPUT_AWS_ACCESS_KEY_ID !== '' &&
    inputData.INPUT_AWS_SECRET_ACCESS_KEY !== ''
  ) {
    core.debug('Using AWS credentials from input');
    s3Data.s3Options = [
      {
        region: inputData.BUCKET_REGION,
        endpoint: `https://${inputData.BUCKET}.s3.${inputData.BUCKET_REGION}.amazonaws.com`,
        credentials: {
          accessKeyId: inputData.INPUT_AWS_ACCESS_KEY_ID,
          secretAccessKey: inputData.INPUT_AWS_SECRET_ACCESS_KEY,
        },
      },
    ];
    s3Data.s3Client = new S3.S3Client(s3Data.s3Options);
  } else {
    core.debug('Using AWS credentials from environment');
    s3Data.s3Options = [
      {
        region: inputData.BUCKET,
        endpoint: `https://${inputData.BUCKET}.s3.${inputData.BUCKET_REGION}.amazonaws.com`,
      },
    ];
    s3Data.s3Client = new S3.S3Client(s3Data.s3Options);
  }
  s3Data.deletedCommandInput = {
    Bucket: core.getInput('aws_bucket_name'),
    Delete: { Objects: [] },
  };
  s3Data.deleteCommand = new S3.DeleteObjectsCommand(
    s3Data.deletedCommandInput,
  );
};

export const listObjects = async (
  callback1: (objects: S3._Object[], callback: (key?: string) => void) => void,
  callback2: (key?: string) => void,
): Promise<void> => {
  const listRequest: ListObjectsV2Request = {
    Bucket: inputData.BUCKET,
  };

  if (inputData.IS_PREFIX_MATCH === 'true') {
    listRequest.Prefix = inputData.OBJECT_KEY_TO_DELETE;
  }

  const listCommand: S3.ListObjectsV2Command = new S3.ListObjectsV2Command(
    listRequest,
  );

  const response: S3.ListObjectsV2Output =
    await s3Data.s3Client.send(listCommand);

  if (!response.Contents || response.Contents?.length === 0) return;

  if (callback1) {
    callback1(response.Contents, callback2);
  }

  if (response.IsTruncated) {
    await listObjects(callback1, callback2);
  }
};

export const processObjectsFunc = (
  objects: S3._Object[],
  callback: (objectKey?: string) => void,
): void => {
  for (const object of objects) {
    if (objectKeyMatches(object.Key)) {
      callback(object.Key);
    }
  }
};

export const objectKeyMatches = (objectKey: string | undefined): boolean => {
  if (!objectKey) return false;

  if (inputData.IS_FULL_MATCH === 'true') {
    return objectKey === inputData.OBJECT_KEY_TO_DELETE;
  } else if (inputData.IS_ANY_MATCH === 'true') {
    return objectKey.includes(inputData.OBJECT_KEY_TO_DELETE);
  } else if (inputData.IS_PREFIX_MATCH === 'true') {
    return objectKey.startsWith(inputData.OBJECT_KEY_TO_DELETE);
  } else if (inputData.IS_SUFFIX_MATCH === 'true') {
    return objectKey.endsWith(inputData.OBJECT_KEY_TO_DELETE);
  }
  return false;
};

export const processObjectToDelete = (objectKey?: string): void => {
  if (objectKey) {
    if (inputData.DRY_RUN === 'true') {
      core.info(`Would delete object: ${objectKey}`);
    } else {
      s3Data.deletedCommandInput.Delete?.Objects?.push({ Key: objectKey });
    }
  }
};

export const deleteObjects = async (): Promise<S3.DeletedObject[]> => {
  await listObjects(processObjectsFunc, processObjectToDelete);

  if (s3Data.deletedCommandInput.Delete?.Objects?.length === 0) {
    core.info('No objects to delete');
    return [];
  } else {
    const { Deleted } = await s3Data.s3Client.send(s3Data.deleteCommand);

    if (Deleted && Deleted?.length > 0) {
      core.info(
        `Successfully deleted ${Deleted?.length} objects from S3 bucket. Deleted objects:`,
      );

      core.info(Deleted?.map((d) => ` • ${d.Key}`).join('\n'));

      return Deleted;
    } else {
      return [];
    }
  }
};

export const run = async (): Promise<void> => {
  try {
    prepareInputValues();
    init();
    const result: S3.DeletedObject[] = await deleteObjects();
    core.setOutput('deleted_objects', result);
  } catch (error) {
    core.setFailed(`Action failed with error ${error}`);
  }
};

// eslint-disable-next-line github/no-then
run().then(() => core.info('Action finished successfully'));

type InputData = {
  INPUT_AWS_ACCESS_KEY_ID: string;
  INPUT_AWS_SECRET_ACCESS_KEY: string;
  BUCKET: string;
  BUCKET_REGION: string;
  IS_FULL_MATCH: string;
  IS_ANY_MATCH: string;
  IS_PREFIX_MATCH: string;
  IS_SUFFIX_MATCH: string;
  OBJECT_KEY_TO_DELETE: string;
  DRY_RUN: string;
};

type S3Data = {
  s3Options: types.CheckOptionalClientConfig<S3.S3ClientConfig>;
  s3Client: S3.S3Client;
  deletedCommandInput: DeleteObjectsCommandInput;
  deleteCommand: S3.DeleteObjectsCommand;
};

export { inputData, s3Data };
