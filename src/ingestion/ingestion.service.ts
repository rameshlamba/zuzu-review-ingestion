import { Injectable } from '@nestjs/common';
import { S3Service } from '../s3/s3.service';
import { ReviewsService } from '../reviews/reviews.service';
import { Logger } from '../utils/logger';

@Injectable()
export class IngestionService {
  private isRunning = false;

  constructor(
    private readonly s3: S3Service,
    private readonly reviews: ReviewsService,
  ) {}

  async runIngestion(): Promise<{ processed: number; skipped: number; errors: number }> {
    if (this.isRunning) {
      Logger.warn('Ingestion already running, skipping...');
      return { processed: 0, skipped: 0, errors: 0 };
    }

    this.isRunning = true;
    const bucket = process.env.S3_BUCKET;
    const prefix = process.env.S3_PREFIX || '';

    if (!bucket) {
      throw new Error('S3_BUCKET environment variable is required');
    }

    Logger.log('Starting ingestion process...', { bucket, prefix });

    let processed = 0;
    let skipped = 0;
    let errors = 0;

    try {
      const files = await this.s3.listFiles(bucket, prefix);
      Logger.log(`Found ${files.length} files to process`);

      if (files.length === 0) {
        Logger.log('No files found for processing');
        return { processed, skipped, errors };
      }

      // Process files concurrently with a limit
      const concurrencyLimit = parseInt(process.env.INGESTION_CONCURRENCY || '3');
      const chunks = this.chunkArray(files, concurrencyLimit);

      for (const chunk of chunks) {
        const promises = chunk.map(async key => {
          try {
            if (await this.reviews.isFileProcessed(key)) {
              Logger.log(`Skipping already processed file: ${key}`);
              skipped++;
              return;
            }

            Logger.log(`Processing file: ${key}`);
            const startTime = Date.now();

            // Get file metadata for logging
            const metadata = await this.s3.getFileMetadata(bucket, key);
            Logger.log(
              `File ${key} - Size: ${metadata.size} bytes, Modified: ${metadata.lastModified}`,
            );

            const stream = await this.s3.streamJsonLines(bucket, key);
            const data = await this.s3.parseJsonLines(stream);

            if (data.length === 0) {
              Logger.warn(`No valid data found in file: ${key}`);
              return;
            }

            await this.reviews.storeReviews(data, key);

            const duration = Date.now() - startTime;
            Logger.log(
              `Successfully processed file: ${key} (${data.length} records in ${duration}ms)`,
            );
            processed++;
          } catch (error) {
            Logger.error(`Failed to process file: ${key}`, error);
            errors++;
          }
        });

        await Promise.all(promises);
      }

      Logger.log('Ingestion process completed', { processed, skipped, errors });
    } catch (error) {
      Logger.error('Ingestion process failed', error);
      errors++;
      throw error;
    } finally {
      this.isRunning = false;
    }

    return { processed, skipped, errors };
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  async getIngestionStatus(): Promise<{ isRunning: boolean; stats?: any }> {
    const stats = await this.reviews.getReviewStats();
    return {
      isRunning: this.isRunning,
      stats,
    };
  }

  async triggerManualIngestion(): Promise<{ processed: number; skipped: number; errors: number }> {
    Logger.log('Manual ingestion triggered');
    return this.runIngestion();
  }
}
