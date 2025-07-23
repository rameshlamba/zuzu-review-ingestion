import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review, ProcessedFile } from '../src/reviews/reviews.entity';

describe('Review System Microservice (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        // Override with test database
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT) || 5432,
          username: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || 'postgres',
          database: process.env.DB_NAME || 'reviews_test',
          entities: [Review, ProcessedFile],
          synchronize: true, // Use synchronize for tests
          dropSchema: true, // Clean database for each test run
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/ingestion/status (GET)', () => {
    it('should return ingestion status', () => {
      return request(app.getHttpServer())
        .get('/ingestion/status')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('isRunning');
          expect(res.body).toHaveProperty('stats');
          expect(res.body.stats).toHaveProperty('totalReviews');
          expect(res.body.stats).toHaveProperty('totalFiles');
          expect(res.body.stats).toHaveProperty('platformStats');
        });
    });
  });

  describe('/ingestion/trigger (POST)', () => {
    it('should trigger manual ingestion', () => {
      return request(app.getHttpServer())
        .post('/ingestion/trigger')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success');
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('result');
          expect(res.body.result).toHaveProperty('processed');
          expect(res.body.result).toHaveProperty('skipped');
          expect(res.body.result).toHaveProperty('errors');
        });
    });

    it('should handle concurrent ingestion requests', async () => {
      // Trigger multiple concurrent requests
      const requests = Array(3).fill(null).map(() =>
        request(app.getHttpServer())
          .post('/ingestion/trigger')
          .expect(200)
      );

      const responses = await Promise.all(requests);
      
      // All should succeed
      responses.forEach(response => {
        expect(response.body).toHaveProperty('success', true);
      });
    });
  });

  describe('Application Health', () => {
    it('should start successfully', () => {
      expect(app).toBeDefined();
    });

    it('should handle invalid routes', () => {
      return request(app.getHttpServer())
        .get('/invalid-route')
        .expect(404);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed requests gracefully', () => {
      return request(app.getHttpServer())
        .post('/ingestion/trigger')
        .send({ invalid: 'data' })
        .expect(200); // Should still work as it doesn't require body
    });
  });
});