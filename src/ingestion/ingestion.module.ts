import { Module } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { IngestionController } from './ingestion.controller';
import { S3Module } from '../s3/s3.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { CronTask } from './cron.task';

@Module({
  imports: [S3Module, ReviewsModule],
  controllers: [IngestionController],
  providers: [IngestionService, CronTask],
  exports: [IngestionService],
})
export class IngestionModule {}