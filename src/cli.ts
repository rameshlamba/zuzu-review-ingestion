#!/usr/bin/env node

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IngestionService } from './ingestion/ingestion.service';
import { ReviewsService } from './reviews/reviews.service';
import { Logger } from './utils/logger';

async function runCLI() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const command = process.argv[2];
  const ingestionService = app.get(IngestionService);
  const reviewsService = app.get(ReviewsService);

  try {
    switch (command) {
      case 'ingest':
        Logger.log('Starting manual ingestion via CLI...');
        const result = await ingestionService.runIngestion();
        Logger.log('Ingestion completed', result);
        break;
        
      case 'status':
        const status = await ingestionService.getIngestionStatus();
        console.log(JSON.stringify(status, null, 2));
        break;
        
      case 'stats':
        const stats = await reviewsService.getReviewStats();
        console.log(JSON.stringify(stats, null, 2));
        break;
        
      default:
        console.log(`
Review System CLI

Usage: npm run cli <command>

Commands:
  ingest    - Run manual ingestion process
  status    - Get current ingestion status
  stats     - Get review statistics

Examples:
  npm run cli ingest
  npm run cli status
  npm run cli stats
        `);
    }
  } catch (error) {
    Logger.error('CLI command failed', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

if (require.main === module) {
  runCLI();
}