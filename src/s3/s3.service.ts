import { Injectable } from '@nestjs/common';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import * as readline from 'readline';
import { Logger } from '../utils/logger';

@Injectable()
export class S3Service {
  private readonly client: S3Client;

  constructor() {
    this.client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      maxAttempts: 3,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async listFiles(bucket: string, prefix: string): Promise<string[]> {
    try {
      const files: string[] = [];
      let continuationToken: string | undefined;

      do {
        const command = new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
          MaxKeys: 1000,
        });

        const result = await this.client.send(command);

        if (result.Contents) {
          const jsonlFiles = result.Contents
            .filter(obj => obj.Key?.endsWith('.jl') || obj.Key?.endsWith('.jsonl'))
            .map(obj => obj.Key!)
            .filter(key => key !== prefix); // Exclude the prefix itself if it's a "folder"

          files.push(...jsonlFiles);
        }

        continuationToken = result.NextContinuationToken;
      } while (continuationToken);

      Logger.log(`Found ${files.length} JSONL files in S3`);
      return files;
    } catch (error) {
      Logger.error('Error listing files from S3', error);
      throw error;
    }
  }

  async streamJsonLines(bucket: string, key: string): Promise<Readable> {
    try {
      const command = new GetObjectCommand({ Bucket: bucket, Key: key });
      const { Body } = await this.client.send(command);

      if (!Body) {
        throw new Error(`Empty response body for ${key}`);
      }

      return Body as Readable;
    } catch (error) {
      Logger.error(`Error streaming file ${key}`, error);
      throw error;
    }
  }

  async parseJsonLines(stream: Readable): Promise<any[]> {
    const rl = readline.createInterface({
      input: stream,
      crlfDelay: Infinity, // Handle Windows line endings
    });

    const results = [];
    let lineNumber = 0;

    try {
      for await (const line of rl) {
        lineNumber++;

        if (line.trim() === '') {
          continue; // Skip empty lines
        }

        try {
          const parsed = JSON.parse(line);
          results.push(parsed);
        } catch (parseError) {
          Logger.warn(`Malformed JSONL line ${lineNumber} skipped`, {
            line: line.substring(0, 100) + (line.length > 100 ? '...' : ''),
            error: parseError.message
          });
        }
      }
    } catch (error) {
      Logger.error('Error reading JSONL stream', error);
      throw error;
    }

    Logger.log(`Parsed ${results.length} valid JSON objects from ${lineNumber} lines`);
    return results;
  }

  async getFileMetadata(bucket: string, key: string): Promise<{ size: number; lastModified: Date }> {
    try {
      const command = new GetObjectCommand({ Bucket: bucket, Key: key });
      const response = await this.client.send(command);

      return {
        size: response.ContentLength || 0,
        lastModified: response.LastModified || new Date(),
      };
    } catch (error) {
      Logger.error(`Error getting metadata for ${key}`, error);
      throw error;
    }
  }
}