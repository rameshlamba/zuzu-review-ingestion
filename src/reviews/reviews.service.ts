import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review, ProcessedFile } from './reviews.entity';
import { Logger } from '../utils/logger';
import { ReviewQueryDto } from './dto/review-query.dto';
import { PaginatedReviewResponseDto, ReviewResponseDto, ReviewStatsDto } from './dto/review-response.dto';

interface ReviewerInfo {
  countryName?: string;
  displayMemberName?: string;
  flagName?: string;
  reviewGroupName?: string;
  roomTypeName?: string;
  countryId?: number;
  lengthOfStay?: number;
  reviewGroupId?: number;
  roomTypeId?: number;
  reviewerReviewedCount?: number;
  isExpertReviewer?: boolean;
  isShowGlobalIcon?: boolean;
  isShowReviewedCount?: boolean;
}

interface ReviewComment {
  hotelReviewId: number;
  providerId: number;
  rating: string | number;
  checkInDateMonthAndYear?: string;
  encryptedReviewData?: string;
  formattedRating: string;
  formattedReviewDate: string;
  ratingText: string;
  responderName?: string;
  responseDateText?: string;
  responseTranslateSource?: string;
  reviewComments: string;
  reviewNegatives?: string;
  reviewPositives?: string;
  reviewProviderLogo?: string;
  reviewProviderText: string;
  reviewTitle: string;
  translateSource: string;
  translateTarget: string;
  reviewDate: string;
  originalTitle?: string;
  originalComment?: string;
  formattedResponseDate?: string;
  reviewerInfo?: ReviewerInfo;
}

interface ReviewData {
  hotelId: number;
  platform: string;
  hotelName: string;
  comment: ReviewComment;
  overallByProviders?: unknown[];
}

interface ReviewStats {
  totalReviews: number;
  totalFiles: number;
  platformStats: Array<{
    platform: string;
    count: string;
    avgRating: string;
  }>;
}

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(ProcessedFile)
    private processedFileRepository: Repository<ProcessedFile>,
  ) {}

  async isFileProcessed(fileName: string): Promise<boolean> {
    const processedFile = await this.processedFileRepository.findOne({
      where: { fileName },
    });
    return !!processedFile;
  }

  async storeReviews(reviewsData: unknown[], fileName: string): Promise<void> {
    const validReviews = [];
    let skippedCount = 0;

    for (const reviewData of reviewsData) {
      try {
        const review = this.transformReviewData(reviewData);
        if (this.validateReviewData(review)) {
          validReviews.push(review);
        } else {
          skippedCount++;
          Logger.warn('Invalid review data skipped', {
            fileName,
            reviewData: (reviewData as ReviewData)?.comment?.hotelReviewId,
          });
        }
      } catch (error) {
        skippedCount++;
        Logger.warn('Failed to transform review data', { fileName, error: error.message });
      }
    }

    if (validReviews.length > 0) {
      try {
        await this.reviewRepository.save(validReviews);
        Logger.log(`Stored ${validReviews.length} reviews from ${fileName}`);
      } catch (error) {
        Logger.error('Failed to save reviews to database', error);
        throw error;
      }
    }

    // Mark file as processed
    await this.markFileAsProcessed(fileName, validReviews.length);

    if (skippedCount > 0) {
      Logger.warn(`Skipped ${skippedCount} invalid reviews from ${fileName}`);
    }
  }

  private transformReviewData(data: unknown): Partial<Review> {
    const reviewData = data as ReviewData;
    const comment = reviewData.comment;
    const reviewerInfo = comment.reviewerInfo || {};
    const overallByProviders = reviewData.overallByProviders || [];

    return {
      hotelId: reviewData.hotelId,
      platform: reviewData.platform,
      hotelName: reviewData.hotelName,
      hotelReviewId: comment.hotelReviewId,
      providerId: comment.providerId,
      rating: parseFloat(String(comment.rating)),
      checkInDateMonthAndYear: comment.checkInDateMonthAndYear,
      encryptedReviewData: comment.encryptedReviewData,
      formattedRating: comment.formattedRating,
      formattedReviewDate: comment.formattedReviewDate,
      ratingText: comment.ratingText,
      responderName: comment.responderName,
      responseDateText: comment.responseDateText,
      responseTranslateSource: comment.responseTranslateSource,
      reviewComments: comment.reviewComments,
      reviewNegatives: comment.reviewNegatives,
      reviewPositives: comment.reviewPositives,
      reviewProviderLogo: comment.reviewProviderLogo,
      reviewProviderText: comment.reviewProviderText,
      reviewTitle: comment.reviewTitle,
      translateSource: comment.translateSource,
      translateTarget: comment.translateTarget,
      reviewDate: new Date(comment.reviewDate),
      originalTitle: comment.originalTitle,
      originalComment: comment.originalComment,
      formattedResponseDate: comment.formattedResponseDate,
      reviewerCountryName: reviewerInfo.countryName,
      reviewerDisplayName: reviewerInfo.displayMemberName,
      reviewerFlagName: reviewerInfo.flagName,
      reviewerGroupName: reviewerInfo.reviewGroupName,
      roomTypeName: reviewerInfo.roomTypeName,
      reviewerCountryId: reviewerInfo.countryId,
      lengthOfStay: reviewerInfo.lengthOfStay,
      reviewGroupId: reviewerInfo.reviewGroupId,
      roomTypeId: reviewerInfo.roomTypeId,
      reviewerReviewedCount: reviewerInfo.reviewerReviewedCount,
      isExpertReviewer: reviewerInfo.isExpertReviewer || false,
      isShowGlobalIcon: reviewerInfo.isShowGlobalIcon || false,
      isShowReviewedCount: reviewerInfo.isShowReviewedCount || false,
      overallByProviders: overallByProviders,
    };
  }

  private validateReviewData(review: Partial<Review>): boolean {
    // Check required fields
    const requiredFields = [
      'hotelId',
      'platform',
      'hotelName',
      'hotelReviewId',
      'providerId',
      'rating',
      'reviewComments',
      'reviewDate',
    ];

    for (const field of requiredFields) {
      if (!review[field] && review[field] !== 0) {
        Logger.warn(`Missing required field: ${field}`);
        return false;
      }
    }

    // Validate rating range
    if (review.rating < 0 || review.rating > 10) {
      Logger.warn(`Invalid rating: ${review.rating}`);
      return false;
    }

    // Validate date
    if (isNaN(review.reviewDate.getTime())) {
      Logger.warn(`Invalid review date: ${review.reviewDate}`);
      return false;
    }

    return true;
  }

  private async markFileAsProcessed(fileName: string, reviewCount: number): Promise<void> {
    const processedFile = new ProcessedFile();
    processedFile.fileName = fileName;
    processedFile.processedAt = new Date();
    processedFile.reviewCount = reviewCount;

    try {
      await this.processedFileRepository.save(processedFile);
    } catch (error) {
      Logger.error('Failed to mark file as processed', error);
      throw error;
    }
  }

  async getReviewStats(): Promise<ReviewStats> {
    const totalReviews = await this.reviewRepository.count();
    const totalFiles = await this.processedFileRepository.count();

    const platformStats = await this.reviewRepository
      .createQueryBuilder('review')
      .select('review.platform', 'platform')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(review.rating)', 'avgRating')
      .groupBy('review.platform')
      .getRawMany();

    return {
      totalReviews,
      totalFiles,
      platformStats,
    };
  }

  async findReviews(query: ReviewQueryDto): Promise<PaginatedReviewResponseDto> {
    const {
      page = 1,
      limit = 20,
      hotelId,
      platform,
      hotelName,
      minRating,
      maxRating,
      startDate,
      endDate,
      reviewerCountry,
      search,
      sortBy = 'reviewDate',
      sortOrder = 'DESC',
      includeStats = false,
    } = query;

    const queryBuilder = this.reviewRepository.createQueryBuilder('review');

    // Apply filters
    if (hotelId) {
      queryBuilder.andWhere('review.hotelId = :hotelId', { hotelId });
    }

    if (platform) {
      queryBuilder.andWhere('review.platform ILIKE :platform', { platform: `%${platform}%` });
    }

    if (hotelName) {
      queryBuilder.andWhere('review.hotelName ILIKE :hotelName', { hotelName: `%${hotelName}%` });
    }

    if (minRating !== undefined) {
      queryBuilder.andWhere('review.rating >= :minRating', { minRating });
    }

    if (maxRating !== undefined) {
      queryBuilder.andWhere('review.rating <= :maxRating', { maxRating });
    }

    if (startDate) {
      queryBuilder.andWhere('review.reviewDate >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('review.reviewDate <= :endDate', { endDate });
    }

    if (reviewerCountry) {
      queryBuilder.andWhere('review.reviewerCountryName ILIKE :reviewerCountry', {
        reviewerCountry: `%${reviewerCountry}%`,
      });
    }

    if (search) {
      queryBuilder.andWhere(
        '(review.reviewComments ILIKE :search OR review.reviewTitle ILIKE :search OR review.hotelName ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Apply sorting
    queryBuilder.orderBy(`review.${sortBy}`, sortOrder);

    // Get total count for pagination
    const total = await queryBuilder.getCount();

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Execute query
    const reviews = await queryBuilder.getMany();

    // Transform to response DTOs
    const data = reviews.map(this.transformToResponseDto);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    const result: PaginatedReviewResponseDto = {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    };

    // Include stats if requested
    if (includeStats) {
      result.stats = await this.getDetailedStats(query);
    }

    return result;
  }

  async findReviewById(id: number): Promise<ReviewResponseDto | null> {
    const review = await this.reviewRepository.findOne({ where: { id } });
    
    if (!review) {
      return null;
    }

    return this.transformToResponseDto(review);
  }

  async getDetailedStats(query: ReviewQueryDto): Promise<ReviewStatsDto> {
    const baseQuery = this.reviewRepository.createQueryBuilder('review');

    // Apply same filters as main query (excluding pagination and sorting)
    this.applyFilters(baseQuery, query);

    // Get total reviews
    const totalReviews = await baseQuery.getCount();

    // Get average rating
    const avgResult = await baseQuery
      .select('AVG(review.rating)', 'avgRating')
      .getRawOne();
    const averageRating = parseFloat(avgResult.avgRating) || 0;

    // Get platform breakdown
    const platformBreakdown = await baseQuery
      .select('review.platform', 'platform')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(review.rating)', 'averageRating')
      .groupBy('review.platform')
      .orderBy('COUNT(*)', 'DESC')
      .getRawMany();

    // Get rating distribution
    const ratingDistribution = await baseQuery
      .select('FLOOR(review.rating)', 'rating')
      .addSelect('COUNT(*)', 'count')
      .groupBy('FLOOR(review.rating)')
      .orderBy('FLOOR(review.rating)', 'ASC')
      .getRawMany();

    // Get date range
    const dateRange = await baseQuery
      .select('MIN(review.reviewDate)', 'earliest')
      .addSelect('MAX(review.reviewDate)', 'latest')
      .getRawOne();

    return {
      totalReviews,
      averageRating: Math.round(averageRating * 100) / 100,
      platformBreakdown: platformBreakdown.map(p => ({
        platform: p.platform,
        count: parseInt(p.count),
        averageRating: Math.round(parseFloat(p.averageRating) * 100) / 100,
      })),
      ratingDistribution: ratingDistribution.map(r => ({
        rating: parseInt(r.rating),
        count: parseInt(r.count),
      })),
      dateRange: {
        earliest: dateRange.earliest,
        latest: dateRange.latest,
      },
    };
  }

  async getAvailablePlatforms(): Promise<string[]> {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .select('DISTINCT review.platform', 'platform')
      .orderBy('review.platform', 'ASC')
      .getRawMany();

    return result.map(r => r.platform);
  }

  private applyFilters(queryBuilder: any, query: ReviewQueryDto): void {
    const {
      hotelId,
      platform,
      hotelName,
      minRating,
      maxRating,
      startDate,
      endDate,
      reviewerCountry,
      search,
    } = query;

    if (hotelId) {
      queryBuilder.andWhere('review.hotelId = :hotelId', { hotelId });
    }

    if (platform) {
      queryBuilder.andWhere('review.platform ILIKE :platform', { platform: `%${platform}%` });
    }

    if (hotelName) {
      queryBuilder.andWhere('review.hotelName ILIKE :hotelName', { hotelName: `%${hotelName}%` });
    }

    if (minRating !== undefined) {
      queryBuilder.andWhere('review.rating >= :minRating', { minRating });
    }

    if (maxRating !== undefined) {
      queryBuilder.andWhere('review.rating <= :maxRating', { maxRating });
    }

    if (startDate) {
      queryBuilder.andWhere('review.reviewDate >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('review.reviewDate <= :endDate', { endDate });
    }

    if (reviewerCountry) {
      queryBuilder.andWhere('review.reviewerCountryName ILIKE :reviewerCountry', {
        reviewerCountry: `%${reviewerCountry}%`,
      });
    }

    if (search) {
      queryBuilder.andWhere(
        '(review.reviewComments ILIKE :search OR review.reviewTitle ILIKE :search OR review.hotelName ILIKE :search)',
        { search: `%${search}%` }
      );
    }
  }

  private transformToResponseDto(review: Review): ReviewResponseDto {
    return {
      id: review.id,
      hotelId: review.hotelId,
      platform: review.platform,
      hotelName: review.hotelName,
      hotelReviewId: review.hotelReviewId,
      providerId: review.providerId,
      rating: review.rating,
      reviewComments: review.reviewComments,
      reviewDate: review.reviewDate,
      formattedReviewDate: review.formattedReviewDate,
      reviewTitle: review.reviewTitle,
      ratingText: review.ratingText,
      reviewPositives: review.reviewPositives,
      reviewNegatives: review.reviewNegatives,
      reviewerCountryName: review.reviewerCountryName,
      reviewerDisplayName: review.reviewerDisplayName,
      lengthOfStay: review.lengthOfStay,
      reviewerReviewedCount: review.reviewerReviewedCount,
      isExpertReviewer: review.isExpertReviewer,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }
}
