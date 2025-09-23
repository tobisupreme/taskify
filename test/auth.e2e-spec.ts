import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Authentication (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/auth/register (POST) - should register a new user', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'test@example.com', password: 'password123' })
      .expect(201)
      .then((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('email', 'test@example.com');
        expect(res.body).not.toHaveProperty('password');
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
