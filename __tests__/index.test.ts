import * as core from '@actions/core';
import * as index from '../src/index';
import { AwsCredentialIdentity } from '@smithy/types';
import * as S3 from '@aws-sdk/client-s3';

const infoMock = jest.spyOn(core, 'info');
const setOutputMock = jest.spyOn(core, 'setOutput');
const setFailedMock = jest.spyOn(core, 'setFailed');

describe('Test index.ts', () => {
  describe('Test prepareInputValues function', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
      jest.clearAllMocks();
      jest.resetModules();
      process.env = { ...OLD_ENV };
    });

    afterAll(() => {
      process.env = OLD_ENV;
    });

    it('should set all the input values', () => {
      prepareFullProcessEnvs();

      index.prepareInputValues();

      expect(index.inputData.INPUT_AWS_ACCESS_KEY_ID).toEqual(
        'AWS_ACCESS_KEY_ID',
      );
      expect(index.inputData.INPUT_AWS_SECRET_ACCESS_KEY).toEqual(
        'AWS_SECRET_ACCESS_KEY',
      );
      expect(index.inputData.BUCKET).toEqual('dummy_bucket');
      expect(index.inputData.BUCKET_REGION).toEqual('ap-southeast-2');
      expect(index.inputData.IS_FULL_MATCH).toEqual('true');
      expect(index.inputData.IS_ANY_MATCH).toEqual('false');
      expect(index.inputData.IS_PREFIX_MATCH).toEqual('false');
      expect(index.inputData.IS_SUFFIX_MATCH).toEqual('false');
      expect(index.inputData.OBJECT_KEY_TO_DELETE).toEqual('s3/object/key/1');
      expect(index.inputData.DRY_RUN).toEqual('false');
    });

    it('should set the default values', () => {
      prepareMinimumProcessEnvs();

      index.prepareInputValues();

      expect(index.inputData.INPUT_AWS_ACCESS_KEY_ID).toEqual('');
      expect(index.inputData.INPUT_AWS_SECRET_ACCESS_KEY).toEqual('');
      expect(index.inputData.BUCKET).toEqual('dummy_bucket');
      expect(index.inputData.BUCKET_REGION).toEqual('ap-southeast-2');
      expect(index.inputData.IS_FULL_MATCH).toEqual('true');
      expect(index.inputData.IS_ANY_MATCH).toEqual('false');
      expect(index.inputData.IS_PREFIX_MATCH).toEqual('false');
      expect(index.inputData.IS_SUFFIX_MATCH).toEqual('false');
      expect(index.inputData.OBJECT_KEY_TO_DELETE).toEqual('s3/object/key/1');
      expect(index.inputData.DRY_RUN).toEqual('false');
    });

    it('should throw error', () => {
      process.env['INPUT_AWS_BUCKET_REGION'] = 'ap-southeast-2';
      process.env['INPUT_OBJECT_KEY_TO_DELETE'] = 's3/object/key/1';

      expect(() => index.prepareInputValues()).toThrow();
    });
  });

  describe('Test init function', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
      jest.clearAllMocks();
      jest.resetModules();
      process.env = { ...OLD_ENV };
      prepareFullProcessEnvs();
      index.prepareInputValues();
    });

    afterAll(() => {
      process.env = OLD_ENV;
    });

    it('should set the AWS credentials', () => {
      index.init();

      expect(index.s3Data.s3Client).toBeDefined();
      expect(index.s3Data.s3Options).toBeDefined();
      expect(index.s3Data.s3Options.length).toEqual(1);
      expect(index.s3Data.s3Options[0]?.region).toEqual('ap-southeast-2');
      expect(index.s3Data.s3Options[0]?.endpoint).toEqual(
        'https://dummy_bucket.s3.ap-southeast-2.amazonaws.com',
      );
      expect(index.s3Data.s3Options[0]?.credentials).toBeDefined();
      expect(
        (index.s3Data.s3Options[0]?.credentials as AwsCredentialIdentity)
          .accessKeyId,
      ).toEqual('AWS_ACCESS_KEY_ID');
      expect(
        (index.s3Data.s3Options[0]?.credentials as AwsCredentialIdentity)
          .secretAccessKey,
      ).toEqual('AWS_SECRET_ACCESS_KEY');
    });

    it('should have const variables initialised', async () => {
      index.init();

      expect(index.s3Data.deletedCommandInput).toBeDefined();
      expect(index.s3Data.deletedCommandInput.Bucket).toEqual('dummy_bucket');
      expect(index.s3Data.deletedCommandInput.Delete).toBeDefined();
      expect(index.s3Data.deletedCommandInput.Delete?.Objects).toBeDefined();
      expect(index.s3Data.deletedCommandInput.Delete?.Objects?.length).toEqual(
        0,
      );
      expect(index.s3Data.deleteCommand).toBeDefined();
    });
  });

  describe('Test listObjects function', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
      jest.clearAllMocks();
      jest.resetModules();
      process.env = { ...OLD_ENV };
    });

    afterAll(() => {
      process.env = OLD_ENV;
    });

    it('should call the callback1 function once', async () => {
      prepareFullProcessEnvs();
      index.prepareInputValues();
      index.init();

      const response: S3.ListObjectsV2Output = {
        IsTruncated: false,
        Contents: [
          {
            Key: 's3/object/key/1',
          },
          {
            Key: 's3/object/key/2',
          },
        ],
      };

      const s3ClientSendMock = jest
        .spyOn(index.s3Data.s3Client, 'send')
        .mockImplementation(async () => Promise.resolve(response));

      const callback1Mock = jest.fn();
      const callback2Mock = jest.fn();

      const listObjectsSpy = jest.spyOn(index, 'listObjects');

      await index.listObjects(callback1Mock, callback2Mock);

      expect(s3ClientSendMock).toHaveBeenCalledTimes(1);
      expect(s3ClientSendMock).toHaveBeenCalledWith(
        expect.any(S3.ListObjectsV2Command),
      );
      expect(listObjectsSpy).toHaveBeenCalledTimes(1);
      expect(callback1Mock).toHaveBeenCalledTimes(1);
      expect(callback2Mock).toHaveBeenCalledTimes(0);
    });

    it('should set prefix in the listObjectV2Command', async () => {
      prepareMinimumProcessEnvs();
      process.env['INPUT_IS_FULL_MATCH'] = 'false';
      process.env['INPUT_IS_ANY_MATCH'] = 'false';
      process.env['INPUT_IS_PREFIX_MATCH'] = 'true';
      process.env['INPUT_IS_SUFFIX_MATCH'] = 'false';
      process.env['INPUT_OBJECT_KEY_TO_DELETE'] = 's3/object/';
      index.prepareInputValues();
      index.init();

      const response: S3.ListObjectsV2Output = {
        IsTruncated: false,
        Contents: [
          {
            Key: 's3/object/key/1',
          },
          {
            Key: 's3/object/key/2',
          },
        ],
      };

      const s3ClientSendMock = jest
        .spyOn(index.s3Data.s3Client, 'send')
        .mockImplementation(async () => Promise.resolve(response));

      const callback1Mock = jest.fn();
      const callback2Mock = jest.fn();

      await index.listObjects(callback1Mock, callback2Mock);

      const listCommand: S3.ListObjectsV2Command = s3ClientSendMock.mock
        .calls[0][0] as S3.ListObjectsV2Command;
      expect(listCommand.input.Prefix).toEqual('s3/object/');
    });

    it('should do recursive call when IsTruncated is true', async () => {
      prepareFullProcessEnvs();
      index.prepareInputValues();
      index.init();

      const response1: S3.ListObjectsV2Output = {
        IsTruncated: true,
        Contents: [
          {
            Key: 's3/object/key/1',
          },
          {
            Key: 's3/object/key/2',
          },
        ],
      };

      const response2: S3.ListObjectsV2Output = {
        IsTruncated: false,
        Contents: [
          {
            Key: 's3/object/key/3',
          },
          {
            Key: 's3/object/key/4',
          },
        ],
      };

      const s3ClientSendMock = jest
        .spyOn(index.s3Data.s3Client, 'send')
        .mockImplementationOnce(async () => Promise.resolve(response1))
        .mockImplementationOnce(async () => Promise.resolve(response2));

      const callback1Mock = jest.fn();
      const callback2Mock = jest.fn();

      const listObjectsSpy = jest.spyOn(index, 'listObjects');

      await index.listObjects(callback1Mock, callback2Mock);

      expect(s3ClientSendMock).toHaveBeenCalledTimes(2);
      expect(listObjectsSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Test processObjectsFunc function', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
      jest.clearAllMocks();
      jest.resetModules();
      process.env = { ...OLD_ENV };
      prepareFullProcessEnvs();
      index.prepareInputValues();
      index.init();
    });

    afterAll(() => {
      process.env = OLD_ENV;
    });

    it('should call the callback function once', () => {
      const objects: S3._Object[] = [
        {
          Key: 's3/object/key/1',
        },
        {
          Key: 's3/object/key/2',
        },
      ];

      const callback2Mock = jest.fn();

      index.processObjectsFunc(objects, callback2Mock);

      expect(callback2Mock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Test objectKeyMatches function', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
      jest.clearAllMocks();
      jest.resetModules();
      process.env = { ...OLD_ENV };
    });

    afterAll(() => {
      process.env = OLD_ENV;
    });

    it('should return false when input is undefined', () => {
      const objectKey = undefined;

      const result = index.objectKeyMatches(objectKey);

      expect(result).toEqual(false);
    });

    it('should return true when IS_FULL_MATCH is true', () => {
      prepareMinimumProcessEnvs();
      process.env['INPUT_IS_FULL_MATCH'] = 'true';
      process.env['INPUT_IS_ANY_MATCH'] = 'false';
      process.env['INPUT_IS_PREFIX_MATCH'] = 'false';
      process.env['INPUT_IS_SUFFIX_MATCH'] = 'false';
      process.env['INPUT_OBJECT_KEY_TO_DELETE'] = 's3/object/key/1';
      index.prepareInputValues();
      index.init();

      const objectKey = 's3/object/key/1';

      const result = index.objectKeyMatches(objectKey);

      expect(result).toEqual(true);
    });

    it('should return false when IS_FULL_MATCH is true', () => {
      prepareMinimumProcessEnvs();
      process.env['INPUT_IS_FULL_MATCH'] = 'true';
      process.env['INPUT_IS_ANY_MATCH'] = 'false';
      process.env['INPUT_IS_PREFIX_MATCH'] = 'false';
      process.env['INPUT_IS_SUFFIX_MATCH'] = 'false';
      process.env['INPUT_OBJECT_KEY_TO_DELETE'] = 's3/object/key/2';
      index.prepareInputValues();
      index.init();

      const objectKey = 's3/object/key/1';

      const result = index.objectKeyMatches(objectKey);

      expect(result).toEqual(false);
    });

    it('should return true when INPUT_IS_ANY_MATCH is true', () => {
      prepareMinimumProcessEnvs();
      process.env['INPUT_IS_FULL_MATCH'] = 'false';
      process.env['INPUT_IS_ANY_MATCH'] = 'true';
      process.env['INPUT_IS_PREFIX_MATCH'] = 'false';
      process.env['INPUT_IS_SUFFIX_MATCH'] = 'false';
      process.env['INPUT_OBJECT_KEY_TO_DELETE'] = 'object/key';
      index.prepareInputValues();
      index.init();

      const objectKey = 's3/object/key/1';

      const result = index.objectKeyMatches(objectKey);

      expect(result).toEqual(true);
    });

    it('should return false when INPUT_IS_ANY_MATCH is true', () => {
      prepareMinimumProcessEnvs();
      process.env['INPUT_IS_FULL_MATCH'] = 'false';
      process.env['INPUT_IS_ANY_MATCH'] = 'true';
      process.env['INPUT_IS_PREFIX_MATCH'] = 'false';
      process.env['INPUT_IS_SUFFIX_MATCH'] = 'false';
      process.env['INPUT_OBJECT_KEY_TO_DELETE'] = 'key/3';
      index.prepareInputValues();
      index.init();

      const objectKey = 's3/object/key/1';

      const result = index.objectKeyMatches(objectKey);

      expect(result).toEqual(false);
    });

    it('should return true when INPUT_IS_PREFIX_MATCH is true', () => {
      prepareMinimumProcessEnvs();
      process.env['INPUT_IS_FULL_MATCH'] = 'false';
      process.env['INPUT_IS_ANY_MATCH'] = 'false';
      process.env['INPUT_IS_PREFIX_MATCH'] = 'true';
      process.env['INPUT_IS_SUFFIX_MATCH'] = 'false';
      process.env['INPUT_OBJECT_KEY_TO_DELETE'] = 's3/object/';
      index.prepareInputValues();
      index.init();

      const objectKey = 's3/object/key/1';

      const result = index.objectKeyMatches(objectKey);

      expect(result).toEqual(true);
    });

    it('should return false when INPUT_IS_PREFIX_MATCH is true', () => {
      prepareMinimumProcessEnvs();
      process.env['INPUT_IS_FULL_MATCH'] = 'false';
      process.env['INPUT_IS_ANY_MATCH'] = 'false';
      process.env['INPUT_IS_PREFIX_MATCH'] = 'true';
      process.env['INPUT_IS_SUFFIX_MATCH'] = 'false';
      process.env['INPUT_OBJECT_KEY_TO_DELETE'] = 'object/key';
      index.prepareInputValues();
      index.init();

      const objectKey = 's3/object/key/1';

      const result = index.objectKeyMatches(objectKey);

      expect(result).toEqual(false);
    });

    it('should return true when INPUT_IS_SUFFIX_MATCH is true', () => {
      prepareMinimumProcessEnvs();
      process.env['INPUT_IS_FULL_MATCH'] = 'false';
      process.env['INPUT_IS_ANY_MATCH'] = 'false';
      process.env['INPUT_IS_PREFIX_MATCH'] = 'false';
      process.env['INPUT_IS_SUFFIX_MATCH'] = 'true';
      process.env['INPUT_OBJECT_KEY_TO_DELETE'] = 'key/1';
      index.prepareInputValues();
      index.init();

      const objectKey = 's3/object/key/1';

      const result = index.objectKeyMatches(objectKey);

      expect(result).toEqual(true);
    });

    it('should return true when INPUT_IS_SUFFIX_MATCH is true and the input is the full key', () => {
      prepareMinimumProcessEnvs();
      process.env['INPUT_IS_FULL_MATCH'] = 'false';
      process.env['INPUT_IS_ANY_MATCH'] = 'false';
      process.env['INPUT_IS_PREFIX_MATCH'] = 'false';
      process.env['INPUT_IS_SUFFIX_MATCH'] = 'true';
      process.env['INPUT_OBJECT_KEY_TO_DELETE'] = 's3/object/key/1';
      index.prepareInputValues();
      index.init();

      const objectKey = 's3/object/key/1';

      const result = index.objectKeyMatches(objectKey);

      expect(result).toEqual(true);
    });

    it('should return false when INPUT_IS_SUFFIX_MATCH is true', () => {
      prepareMinimumProcessEnvs();
      process.env['INPUT_IS_FULL_MATCH'] = 'false';
      process.env['INPUT_IS_ANY_MATCH'] = 'false';
      process.env['INPUT_IS_PREFIX_MATCH'] = 'false';
      process.env['INPUT_IS_SUFFIX_MATCH'] = 'true';
      process.env['INPUT_OBJECT_KEY_TO_DELETE'] = '/key/2';
      index.prepareInputValues();
      index.init();

      const objectKey = 's3/object/key/1';

      const result = index.objectKeyMatches(objectKey);

      expect(result).toEqual(false);
    });

    it('should return false when all the MATCH inputs are false', () => {
      prepareMinimumProcessEnvs();
      process.env['INPUT_IS_FULL_MATCH'] = 'false';
      process.env['INPUT_IS_ANY_MATCH'] = 'false';
      process.env['INPUT_IS_PREFIX_MATCH'] = 'false';
      process.env['INPUT_IS_SUFFIX_MATCH'] = 'false';
      process.env['INPUT_OBJECT_KEY_TO_DELETE'] = '/key/2';
      index.prepareInputValues();
      index.init();

      const objectKey = 's3/object/key/1';

      const result = index.objectKeyMatches(objectKey);

      expect(result).toEqual(false);
    });
  });

  describe('Test processObjectToDelete function', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...OLD_ENV };
    });

    afterAll(() => {
      process.env = OLD_ENV;
    });

    it('try run should print out text', () => {
      prepareMinimumProcessEnvs();
      process.env['INPUT_DRY_RUN'] = 'true';
      index.prepareInputValues();
      index.init();

      index.processObjectToDelete('s3/object/key/1');
      index.processObjectToDelete('s3/object/key/2');

      expect(infoMock).toHaveBeenCalledTimes(2);
    });

    it('should call the callback function once', () => {
      prepareFullProcessEnvs();
      index.prepareInputValues();
      index.init();

      index.processObjectToDelete('s3/object/key/1');
      index.processObjectToDelete('s3/object/key/2');

      expect(index.s3Data.deletedCommandInput.Delete?.Objects?.length).toEqual(
        2,
      );
      expect(index.s3Data.deletedCommandInput.Delete?.Objects?.[0].Key).toEqual(
        's3/object/key/1',
      );
      expect(index.s3Data.deletedCommandInput.Delete?.Objects?.[1].Key).toEqual(
        's3/object/key/2',
      );
    });
  });

  describe('Test deleteObjects function', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
      jest.clearAllMocks();
      jest.resetModules();
      process.env = { ...OLD_ENV };
    });

    afterAll(() => {
      process.env = OLD_ENV;
    });

    it('should call core.info function once when bucket is empty', async () => {
      prepareFullProcessEnvs();
      index.prepareInputValues();
      index.init();

      const listResponse: S3.ListObjectsV2Output = {
        IsTruncated: false,
        Contents: [],
      };

      const s3ClientSendMock = jest
        .spyOn(index.s3Data.s3Client, 'send')
        .mockImplementation(async () => Promise.resolve(listResponse));

      await index.deleteObjects();

      expect(s3ClientSendMock).toHaveBeenCalledTimes(1);
      expect(infoMock).toHaveBeenCalledTimes(1);
      expect(infoMock).toHaveBeenCalledWith('No object to delete');
    });

    it('should call core.info function 2 time when 2 Objects matched', async () => {
      prepareFullProcessEnvs();
      index.prepareInputValues();
      index.init();

      const listResponse: S3.ListObjectsV2Output = {
        IsTruncated: false,
        Contents: [
          {
            Key: 's3/object/key/1',
          },
          {
            Key: 's3/object/key/2',
          },
        ],
      };
      const deleteResponse: S3.DeleteObjectsOutput = {
        Deleted: [
          {
            Key: 's3/object/key/1',
          },
          {
            Key: 's3/object/key/2',
          },
        ],
      };

      const s3ClientSendMock = jest
        .spyOn(index.s3Data.s3Client, 'send')
        .mockImplementation(async (command) => {
          if (command instanceof S3.ListObjectsV2Command) {
            return Promise.resolve(listResponse);
          } else if (command instanceof S3.DeleteObjectsCommand) {
            return Promise.resolve(deleteResponse);
          }
          return Promise.resolve();
        });

      await index.deleteObjects();

      expect(s3ClientSendMock).toHaveBeenCalledTimes(2);
      expect(infoMock).toHaveBeenCalledTimes(2);
    });

    it('should return empty array when no file has been deleted', async () => {
      prepareFullProcessEnvs();
      index.prepareInputValues();
      index.init();

      const listResponse: S3.ListObjectsV2Output = {
        IsTruncated: false,
        Contents: [
          {
            Key: 's3/object/key/1',
          },
          {
            Key: 's3/object/key/2',
          },
        ],
      };
      const deleteResponse: S3.DeleteObjectsOutput = {
        Deleted: [],
      };

      const s3ClientSendMock = jest
        .spyOn(index.s3Data.s3Client, 'send')
        .mockImplementation(async (command) => {
          if (command instanceof S3.ListObjectsV2Command) {
            return Promise.resolve(listResponse);
          } else if (command instanceof S3.DeleteObjectsCommand) {
            return Promise.resolve(deleteResponse);
          }
          return Promise.resolve();
        });

      const result: S3.DeletedObject[] = await index.deleteObjects();

      expect(s3ClientSendMock).toHaveBeenCalledTimes(2);
      expect(result.length).toEqual(0);
    });

    it('should return empty array when no file has been deleted - Deleted is undefined', async () => {
      prepareFullProcessEnvs();
      index.prepareInputValues();
      index.init();

      const listResponse: S3.ListObjectsV2Output = {
        IsTruncated: false,
        Contents: [
          {
            Key: 's3/object/key/1',
          },
          {
            Key: 's3/object/key/2',
          },
        ],
      };
      const deleteResponse: S3.DeleteObjectsOutput = {};

      const s3ClientSendMock = jest
        .spyOn(index.s3Data.s3Client, 'send')
        .mockImplementation(async (command) => {
          if (command instanceof S3.ListObjectsV2Command) {
            return Promise.resolve(listResponse);
          } else if (command instanceof S3.DeleteObjectsCommand) {
            return Promise.resolve(deleteResponse);
          }
          return Promise.resolve();
        });

      const result: S3.DeletedObject[] = await index.deleteObjects();

      expect(s3ClientSendMock).toHaveBeenCalledTimes(2);
      expect(result.length).toEqual(0);
    });

    it('should return empty array when in dry run mode', async () => {
      prepareMinimumProcessEnvs();
      process.env['INPUT_DRY_RUN'] = 'true';
      index.prepareInputValues();
      index.init();

      const listResponse: S3.ListObjectsV2Output = {
        IsTruncated: false,
        Contents: [
          {
            Key: 's3/object/key/1',
          },
          {
            Key: 's3/object/key/2',
          },
        ],
      };
      const deleteResponse: S3.DeleteObjectsOutput = {};

      const s3ClientSendMock = jest
        .spyOn(index.s3Data.s3Client, 'send')
        .mockImplementation(async (command) => {
          if (command instanceof S3.ListObjectsV2Command) {
            return Promise.resolve(listResponse);
          } else if (command instanceof S3.DeleteObjectsCommand) {
            return Promise.resolve(deleteResponse);
          }
          return Promise.resolve();
        });

      const result: S3.DeletedObject[] = await index.deleteObjects();

      expect(s3ClientSendMock).toHaveBeenCalledTimes(1);
      expect(result.length).toEqual(0);
    });
  });

  describe('Test run function', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
      jest.clearAllMocks();
      jest.resetModules();
      process.env = { ...OLD_ENV };
    });

    afterAll(() => {
      process.env = OLD_ENV;
    });

    it('should call core.setOutput once', async () => {
      const result: S3.DeletedObject[] = [];
      jest
        .spyOn(index, 'deleteObjects')
        .mockImplementation(async () => Promise.resolve(result));

      prepareMinimumProcessEnvs();
      await index.run();

      expect(setOutputMock).toHaveBeenCalledTimes(1);
    });

    it('should call core.setFailed once', async () => {
      process.env['INPUT_AWS_BUCKET_REGION'] = 'ap-southeast-2';
      process.env['INPUT_OBJECT_KEY_TO_DELETE'] = 's3/object/key/1';

      await index.run();

      expect(setFailedMock).toHaveBeenCalledTimes(1);
    });
  });

  function prepareFullProcessEnvs(): void {
    process.env['INPUT_AWS_ACCESS_KEY_ID'] = 'AWS_ACCESS_KEY_ID';
    process.env['INPUT_AWS_SECRET_ACCESS_KEY'] = 'AWS_SECRET_ACCESS_KEY';
    process.env['INPUT_AWS_BUCKET_NAME'] = 'dummy_bucket';
    process.env['INPUT_AWS_BUCKET_REGION'] = 'ap-southeast-2';
    process.env['INPUT_IS_FULL_MATCH'] = 'true';
    process.env['INPUT_IS_ANY_MATCH'] = 'false';
    process.env['INPUT_IS_PREFIX_MATCH'] = 'false';
    process.env['INPUT_IS_SUFFIX_MATCH'] = 'false';
    process.env['INPUT_OBJECT_KEY_TO_DELETE'] = 's3/object/key/1';
    process.env['INPUT_DRY_RUN'] = 'false';
  }

  function prepareMinimumProcessEnvs(): void {
    process.env['INPUT_AWS_BUCKET_NAME'] = 'dummy_bucket';
    process.env['INPUT_AWS_BUCKET_REGION'] = 'ap-southeast-2';
    process.env['INPUT_OBJECT_KEY_TO_DELETE'] = 's3/object/key/1';
  }
});
