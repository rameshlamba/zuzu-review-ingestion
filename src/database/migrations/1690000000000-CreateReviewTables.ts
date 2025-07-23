import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateReviewTables1690000000000 implements MigrationInterface {
  name = 'CreateReviewTables1690000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create reviews table
    await queryRunner.createTable(
      new Table({
        name: 'reviews',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'hotelId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'platform',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'hotelName',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'hotelReviewId',
            type: 'bigint',
            isNullable: false,
          },
          {
            name: 'providerId',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'rating',
            type: 'decimal',
            precision: 3,
            scale: 1,
            isNullable: false,
          },
          {
            name: 'checkInDateMonthAndYear',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'encryptedReviewData',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'formattedRating',
            type: 'varchar',
            length: '10',
            isNullable: false,
          },
          {
            name: 'formattedReviewDate',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'ratingText',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'responderName',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'responseDateText',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'responseTranslateSource',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'reviewComments',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'reviewNegatives',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'reviewPositives',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'reviewProviderLogo',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'reviewProviderText',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'reviewTitle',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'translateSource',
            type: 'varchar',
            length: '10',
            isNullable: false,
          },
          {
            name: 'translateTarget',
            type: 'varchar',
            length: '10',
            isNullable: false,
          },
          {
            name: 'reviewDate',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'originalTitle',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'originalComment',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'formattedResponseDate',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          // Reviewer Info columns
          {
            name: 'reviewerCountryName',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'reviewerDisplayName',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'reviewerFlagName',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'reviewerGroupName',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'roomTypeName',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'reviewerCountryId',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'lengthOfStay',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'reviewGroupId',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'roomTypeId',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'reviewerReviewedCount',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'isExpertReviewer',
            type: 'boolean',
            default: false,
          },
          {
            name: 'isShowGlobalIcon',
            type: 'boolean',
            default: false,
          },
          {
            name: 'isShowReviewedCount',
            type: 'boolean',
            default: false,
          },
          // Overall Provider Scores (JSON)
          {
            name: 'overallByProviders',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create processed_files table
    await queryRunner.createTable(
      new Table({
        name: 'processed_files',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'fileName',
            type: 'varchar',
            length: '255',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'processedAt',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'reviewCount',
            type: 'int',
            default: 0,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes for better performance
    await queryRunner.query(
      `CREATE INDEX "IDX_REVIEWS_HOTEL_PLATFORM" ON "reviews" ("hotelId", "platform")`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_REVIEWS_DATE" ON "reviews" ("reviewDate")`);
    await queryRunner.query(`CREATE INDEX "IDX_REVIEWS_PROVIDER" ON "reviews" ("providerId")`);
    await queryRunner.query(`CREATE INDEX "IDX_REVIEWS_RATING" ON "reviews" ("rating")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_REVIEWS_HOTEL_REVIEW_ID" ON "reviews" ("hotelReviewId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_PROCESSED_FILES_NAME" ON "processed_files" ("fileName")`,
    );

    // Create trigger for updating updatedAt timestamp
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW."updatedAt" = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_reviews_updated_at 
      BEFORE UPDATE ON reviews 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop trigger and function
    await queryRunner.query('DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;');
    await queryRunner.query('DROP FUNCTION IF EXISTS update_updated_at_column();');

    // Drop indexes
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_REVIEWS_HOTEL_PLATFORM";');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_REVIEWS_DATE";');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_REVIEWS_PROVIDER";');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_REVIEWS_RATING";');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_REVIEWS_HOTEL_REVIEW_ID";');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_PROCESSED_FILES_NAME";');

    // Drop tables
    await queryRunner.dropTable('processed_files');
    await queryRunner.dropTable('reviews');
  }
}
