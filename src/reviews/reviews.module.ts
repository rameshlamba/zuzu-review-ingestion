import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsService } from './reviews.service';
import { Review, ProcessedFile } from './reviews.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Review, ProcessedFile])],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
