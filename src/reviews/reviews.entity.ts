import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('reviews')
@Index(['hotelId', 'platform'])
@Index(['reviewDate'])
@Index(['providerId'])
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  hotelId: number;

  @Column()
  platform: string;

  @Column()
  hotelName: string;

  @Column()
  hotelReviewId: number;

  @Column()
  providerId: number;

  @Column('decimal', { precision: 3, scale: 1 })
  rating: number;

  @Column({ nullable: true })
  checkInDateMonthAndYear: string;

  @Column({ nullable: true })
  encryptedReviewData: string;

  @Column()
  formattedRating: string;

  @Column()
  formattedReviewDate: string;

  @Column()
  ratingText: string;

  @Column({ nullable: true })
  responderName: string;

  @Column({ nullable: true })
  responseDateText: string;

  @Column({ nullable: true })
  responseTranslateSource: string;

  @Column('text')
  reviewComments: string;

  @Column('text', { nullable: true })
  reviewNegatives: string;

  @Column('text', { nullable: true })
  reviewPositives: string;

  @Column({ nullable: true })
  reviewProviderLogo: string;

  @Column()
  reviewProviderText: string;

  @Column()
  reviewTitle: string;

  @Column()
  translateSource: string;

  @Column()
  translateTarget: string;

  @Column()
  reviewDate: Date;

  @Column({ nullable: true })
  originalTitle: string;

  @Column('text', { nullable: true })
  originalComment: string;

  @Column({ nullable: true })
  formattedResponseDate: string;

  // Reviewer Info
  @Column({ nullable: true })
  reviewerCountryName: string;

  @Column({ nullable: true })
  reviewerDisplayName: string;

  @Column({ nullable: true })
  reviewerFlagName: string;

  @Column({ nullable: true })
  reviewerGroupName: string;

  @Column({ nullable: true })
  roomTypeName: string;

  @Column({ nullable: true })
  reviewerCountryId: number;

  @Column({ nullable: true })
  lengthOfStay: number;

  @Column({ nullable: true })
  reviewGroupId: number;

  @Column({ nullable: true })
  roomTypeId: number;

  @Column({ nullable: true })
  reviewerReviewedCount: number;

  @Column({ default: false })
  isExpertReviewer: boolean;

  @Column({ default: false })
  isShowGlobalIcon: boolean;

  @Column({ default: false })
  isShowReviewedCount: boolean;

  // Overall Provider Scores (JSON)
  @Column('jsonb', { nullable: true })
  overallByProviders: unknown;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('processed_files')
export class ProcessedFile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  fileName: string;

  @Column()
  processedAt: Date;

  @Column({ default: 0 })
  reviewCount: number;

  @CreateDateColumn()
  createdAt: Date;
}
