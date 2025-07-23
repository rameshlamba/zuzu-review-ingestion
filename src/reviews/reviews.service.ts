import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review, ProcessedFile } from './reviews.entity';
import { Logger } from '../utils/logger';

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
}
