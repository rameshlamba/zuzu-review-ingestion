import { Controller, Post, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { Logger } from '../utils/logger';

@Controller('ingestion')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post('trigger')
  @HttpCode(HttpStatus.OK)
  async triggerIngestion() {
    Logger.log('Manual ingestion triggered via API');

    try {
      const result = await this.ingestionService.triggerManualIngestion();
      return {
        success: true,
        message: 'Ingestion completed successfully',
        result,
      };
    } catch (error) {
      Logger.error('Manual ingestion failed', error);
      return {
        success: false,
        message: 'Ingestion failed',
        error: error.message,
      };
    }
  }

  @Get('status')
  async getStatus() {
    try {
      const status = await this.ingestionService.getIngestionStatus();
      return {
        success: true,
        ...status,
      };
    } catch (error) {
      Logger.error('Failed to get ingestion status', error);
      return {
        success: false,
        message: 'Failed to get status',
        error: error.message,
      };
    }
  }
}
