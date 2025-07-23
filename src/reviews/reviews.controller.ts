import { Controller, Get, Query, Param, ParseIntPipe, HttpException, HttpStatus } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewQueryDto } from './dto/review-query.dto';
import { PaginatedReviewResponseDto, ReviewResponseDto, ReviewStatsDto } from './dto/review-response.dto';
import { Logger } from '../utils/logger';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get()
  async getReviews(@Query() query: ReviewQueryDto): Promise<PaginatedReviewResponseDto> {
    try {
      Logger.log('Fetching reviews with filters', { query });
      
      const result = await this.reviewsService.findReviews(query);
      
      Logger.log('Reviews fetched successfully', { 
        count: result.data.length, 
        total: result.pagination.total 
      });
      
      return result;
    } catch (error) {
      Logger.error('Failed to fetch reviews', error);
      throw new HttpException(
        'Failed to fetch reviews',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('stats')
  async getReviewStats(@Query() query: ReviewQueryDto): Promise<ReviewStatsDto> {
    try {
      Logger.log('Fetching review statistics', { query });
      
      const stats = await this.reviewsService.getDetailedStats(query);
      
      Logger.log('Review statistics fetched successfully', { 
        totalReviews: stats.totalReviews 
      });
      
      return stats;
    } catch (error) {
      Logger.error('Failed to fetch review statistics', error);
      throw new HttpException(
        'Failed to fetch review statistics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('platforms')
  async getPlatforms(): Promise<{ platforms: string[] }> {
    try {
      Logger.log('Fetching available platforms');
      
      const platforms = await this.reviewsService.getAvailablePlatforms();
      
      Logger.log('Platforms fetched successfully', { count: platforms.length });
      
      return { platforms };
    } catch (error) {
      Logger.error('Failed to fetch platforms', error);
      throw new HttpException(
        'Failed to fetch platforms',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('hotels/:hotelId')
  async getHotelReviews(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @Query() query: ReviewQueryDto
  ): Promise<PaginatedReviewResponseDto> {
    try {
      Logger.log('Fetching reviews for specific hotel', { hotelId, query });
      
      // Override hotelId in query with path parameter
      const hotelQuery = { ...query, hotelId };
      const result = await this.reviewsService.findReviews(hotelQuery);
      
      if (result.pagination.total === 0) {
        throw new HttpException(
          `No reviews found for hotel ID ${hotelId}`,
          HttpStatus.NOT_FOUND
        );
      }
      
      Logger.log('Hotel reviews fetched successfully', { 
        hotelId,
        count: result.data.length,
        total: result.pagination.total 
      });
      
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      Logger.error('Failed to fetch hotel reviews', error);
      throw new HttpException(
        'Failed to fetch hotel reviews',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  async getReviewById(@Param('id', ParseIntPipe) id: number): Promise<ReviewResponseDto> {
    try {
      Logger.log('Fetching review by ID', { id });
      
      const review = await this.reviewsService.findReviewById(id);
      
      if (!review) {
        throw new HttpException(
          `Review with ID ${id} not found`,
          HttpStatus.NOT_FOUND
        );
      }
      
      Logger.log('Review fetched successfully', { id });
      
      return review;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      Logger.error('Failed to fetch review by ID', error);
      throw new HttpException(
        'Failed to fetch review by ID',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}