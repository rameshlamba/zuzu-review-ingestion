import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppModule } from './app.module';
import { ReviewsModule } from './reviews/reviews.module';
import { S3Module } from './s3/s3.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { ConfigModule as AppConfigModule } from './config/config.module';

// Mock all the modules to avoid database connections in tests
jest.mock('@nestjs/typeorm', () => ({
  TypeOrmModule: {
    forRootAsync: jest.fn(() => ({
      module: class MockTypeOrmModule {},
    })),
  },
}));

jest.mock('./reviews/reviews.module', () => ({
  ReviewsModule: class MockReviewsModule {},
}));

jest.mock('./s3/s3.module', () => ({
  S3Module: class MockS3Module {},
}));

jest.mock('./ingestion/ingestion.module', () => ({
  IngestionModule: class MockIngestionModule {},
}));

jest.mock('./config/config.module', () => ({
  ConfigModule: class MockConfigModule {},
}));

describe('AppModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideModule(TypeOrmModule)
      .useModule(class MockTypeOrmModule {})
      .overrideModule(ReviewsModule)
      .useModule(class MockReviewsModule {})
      .overrideModule(S3Module)
      .useModule(class MockS3Module {})
      .overrideModule(IngestionModule)
      .useModule(class MockIngestionModule {})
      .overrideModule(AppConfigModule)
      .useModule(class MockAppConfigModule {})
      .compile();
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should compile successfully', () => {
    expect(module).toBeInstanceOf(TestingModule);
  });

  it('should have AppModule as the root module', () => {
    const app = module.createNestApplication();
    expect(app).toBeDefined();
  });
});
