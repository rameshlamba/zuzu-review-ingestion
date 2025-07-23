import { IsOptional, IsString, IsNumber, IsDateString, IsIn, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class ReviewQueryDto {
  // Pagination
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  // Filtering
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  hotelId?: number;

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsString()
  hotelName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10)
  minRating?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10)
  maxRating?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  reviewerCountry?: string;

  @IsOptional()
  @IsString()
  search?: string;

  // Sorting
  @IsOptional()
  @IsIn(['reviewDate', 'rating', 'createdAt', 'hotelName', 'platform'])
  sortBy?: string = 'reviewDate';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  @Transform(({ value }) => value?.toUpperCase())
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  // Response options
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  includeStats?: boolean = false;
}