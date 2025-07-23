import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IngestionService } from './ingestion.service';
import { Logger } from '../utils/logger';

@Injectable()
export class CronTask {
  constructor(private readonly ingestionService: IngestionService) {}

  // Run daily at 2 AM
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleDailyIngestion() {
    Logger.log('Starting scheduled daily ingestion...');
    
    try {
      const result = await this.ingestionService.runIngestion();
      Logger.log('Scheduled ingestion completed', result);
    } catch (error) {
      Logger.error('Scheduled ingestion failed', error);
    }
  }

  // Optional: Run every 6 hours for more frequent processing
  // Uncomment the lines below to enable more frequent ingestion
  // @Cron('0 */6 * * *')
  // async handleFrequentIngestion() {
  //   Logger.log('Starting frequent ingestion...');
  //   
  //   try {
  //     const result = await this.ingestionService.runIngestion();
  //     Logger.log('Frequent ingestion completed', result);
  //   } catch (error) {
  //     Logger.error('Frequent ingestion failed', error);
  //   }
  // }
}