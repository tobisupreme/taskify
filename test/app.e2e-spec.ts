/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import * as request from 'supertest';
import { NotificationsProducerService } from '../src/notifications/producer/producer.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from './../src/app.module';

const mockNotificationsProducerService = {
  enqueueTaskCompletedNotification: jest.fn(),
};

interface LoginResponse {
  access_token: string;
}

interface TaskResponse {
  id: number;
  title: string;
  description: string | null;
  status: string;
}

interface PaginatedTaskResponse {
  data: TaskResponse[];
  total: number;
  page: number;
  limit: number;
}

interface CommentResponse {
  id: number;
  content: string;
}

interface PaginatedCommentResponse {
  data: CommentResponse[];
  total: number;
  page: number;
  limit: number;
}

describe('App (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(NotificationsProducerService)
      .useValue(mockNotificationsProducerService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.comment.deleteMany();
    await prisma.task.deleteMany();
    await prisma.user.deleteMany();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication', () => {
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

    it('/auth/login (POST) - should log in a user and return an access token', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: hashedPassword,
        },
      });

      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(200)
        .then((res) => {
          const body = res.body as LoginResponse;
          expect(body).toHaveProperty('access_token');
        });
    });
  });

  describe('Tasks', () => {
    describe('POST /tasks', () => {
      it('should not create a task if not authenticated', () => {
        return request(app.getHttpServer())
          .post('/tasks')
          .send({ title: 'New Task' })
          .expect(401);
      });

      it('should create a new task if authenticated', async () => {
        const hashedPassword = await bcrypt.hash('password123', 10);
        await prisma.user.create({
          data: {
            email: 'post-tasks@example.com',
            password: hashedPassword,
          },
        });

        const loginRes = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'post-tasks@example.com', password: 'password123' });

        const accessToken = (loginRes.body as LoginResponse).access_token;

        return request(app.getHttpServer())
          .post('/tasks')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ title: 'My New Task', description: 'A description' })
          .expect(201)
          .then((res) => {
            const body = res.body as TaskResponse;
            expect(body).toHaveProperty('id');
            expect(body).toHaveProperty('title', 'My New Task');
            expect(body).toHaveProperty('status', 'PENDING');
          });
      });
    });

    describe('GET /tasks', () => {
      it('should get all tasks for the authenticated user', async () => {
        const hashedPassword = await bcrypt.hash('password123', 10);
        const user = await prisma.user.create({
          data: {
            email: 'get-tasks@example.com',
            password: hashedPassword,
          },
        });

        const loginRes = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'get-tasks@example.com', password: 'password123' });

        const accessToken = (loginRes.body as LoginResponse).access_token;

        await prisma.task.create({
          data: {
            title: 'Test Task for GET',
            ownerId: user.id,
          },
        });

        return request(app.getHttpServer())
          .get('/tasks')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200)
          .then((res) => {
            const body = res.body as PaginatedTaskResponse;
            expect(body.total).toBe(1);
            expect(body.page).toBe(1);
            expect(body.limit).toBe(10);
            expect(body.data).toBeInstanceOf(Array);
            expect(body.data.length).toBe(1);
            expect(body.data[0].title).toBe('Test Task for GET');
          });
      });

      it('should return paginated tasks', async () => {
        const hashedPassword = await bcrypt.hash('password123', 10);
        const user = await prisma.user.create({
          data: {
            email: 'pagination-user@example.com',
            password: hashedPassword,
          },
        });

        const loginRes = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'pagination-user@example.com',
            password: 'password123',
          });

        const accessToken = (loginRes.body as LoginResponse).access_token;

        for (let i = 1; i <= 15; i++) {
          await prisma.task.create({
            data: {
              title: `Task ${i}`,
              ownerId: user.id,
            },
          });
        }

        return request(app.getHttpServer())
          .get('/tasks?page=2&limit=5')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200)
          .then((res) => {
            const body = res.body as PaginatedTaskResponse;
            expect(body.total).toBe(15);
            expect(body.page).toBe(2);
            expect(body.limit).toBe(5);
            expect(body.data.length).toBe(5);
            expect(body.data[0].title).toBe('Task 6'); // Assuming default order
          });
      });

      it('should filter tasks by status', async () => {
        const hashedPassword = await bcrypt.hash('password123', 10);
        const user = await prisma.user.create({
          data: {
            email: 'filter-user@example.com',
            password: hashedPassword,
          },
        });

        const loginRes = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'filter-user@example.com', password: 'password123' });

        const accessToken = (loginRes.body as LoginResponse).access_token;

        await prisma.task.createMany({
          data: [
            { title: 'Pending Task', ownerId: user.id, status: 'PENDING' },
            { title: 'Completed Task', ownerId: user.id, status: 'COMPLETED' },
          ],
        });

        return request(app.getHttpServer())
          .get('/tasks?status=COMPLETED')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200)
          .then((res) => {
            const body = res.body as PaginatedTaskResponse;
            expect(body.total).toBe(1);
            expect(body.data.length).toBe(1);
            expect(body.data[0].status).toBe('COMPLETED');
          });
      });

      it('should search tasks by title and description', async () => {
        const hashedPassword = await bcrypt.hash('password123', 10);
        const user = await prisma.user.create({
          data: {
            email: 'search-user@example.com',
            password: hashedPassword,
          },
        });

        const loginRes = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'search-user@example.com', password: 'password123' });

        const accessToken = (loginRes.body as LoginResponse).access_token;

        await prisma.task.createMany({
          data: [
            {
              title: 'Important Report',
              description: 'A task about a report.',
              ownerId: user.id,
            },
            {
              title: 'Another Task',
              description: 'This is something else.',
              ownerId: user.id,
            },
            {
              title: 'Final Presentation',
              description: 'A presentation about something important.',
              ownerId: user.id,
            },
          ],
        });

        return request(app.getHttpServer())
          .get('/tasks?search=important')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200)
          .then((res) => {
            const body = res.body as PaginatedTaskResponse;
            expect(body.total).toBe(2);
            expect(body.data.length).toBe(2);
          });
      });
    });
    describe('GET /tasks/:id', () => {
      it('should get a single task by ID for the authenticated user', async () => {
        const hashedPassword = await bcrypt.hash('password123', 10);
        const user = await prisma.user.create({
          data: {
            email: 'get-task-by-id@example.com',
            password: hashedPassword,
          },
        });

        const loginRes = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'get-task-by-id@example.com',
            password: 'password123',
          });

        const accessToken = (loginRes.body as LoginResponse).access_token;

        const task = await prisma.task.create({
          data: {
            title: 'Test Task for GET by ID',
            ownerId: user.id,
          },
        });

        return request(app.getHttpServer())
          .get(`/tasks/${task.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200)
          .then((res) => {
            const body = res.body as TaskResponse;
            expect(body.title).toBe('Test Task for GET by ID');
          });
      });

      it('should return 404 if a user tries to get a task owned by another user', async () => {
        const hashedPassword = await bcrypt.hash('password123', 10);
        const user = await prisma.user.create({
          data: {
            email: 'owner@example.com',
            password: hashedPassword,
          },
        });

        await prisma.user.create({
          data: {
            email: 'another-user@example.com',
            password: hashedPassword,
          },
        });

        const loginRes = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'another-user@example.com', password: 'password123' });

        const accessToken = (loginRes.body as LoginResponse).access_token;

        const task = await prisma.task.create({
          data: {
            title: "Another User's Task",
            ownerId: user.id,
          },
        });

        return request(app.getHttpServer())
          .get(`/tasks/${task.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(404);
      });
    });

    describe('PATCH /tasks/:id', () => {
      it('should update a task for the authenticated user', async () => {
        const hashedPassword = await bcrypt.hash('password123', 10);
        const user = await prisma.user.create({
          data: {
            email: 'update-task@example.com',
            password: hashedPassword,
          },
        });

        const loginRes = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'update-task@example.com', password: 'password123' });

        const accessToken = (loginRes.body as LoginResponse).access_token;

        const task = await prisma.task.create({
          data: {
            title: 'Task to be updated',
            ownerId: user.id,
          },
        });

        return request(app.getHttpServer())
          .patch(`/tasks/${task.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ title: 'Updated Task' })
          .expect(200)
          .then((res) => {
            const body = res.body as TaskResponse;
            expect(body.title).toBe('Updated Task');
          });
      });

      it('should return 404 if a user tries to update a task owned by another user', async () => {
        const hashedPassword = await bcrypt.hash('password123', 10);
        const user = await prisma.user.create({
          data: {
            email: 'owner-update@example.com',
            password: hashedPassword,
          },
        });

        await prisma.user.create({
          data: {
            email: 'another-user-update@example.com',
            password: hashedPassword,
          },
        });

        const loginRes = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'another-user-update@example.com',
            password: 'password123',
          });

        const accessToken = (loginRes.body as LoginResponse).access_token;

        const task = await prisma.task.create({
          data: {
            title: "Another User's Task to Update",
            ownerId: user.id,
          },
        });

        return request(app.getHttpServer())
          .patch(`/tasks/${task.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ title: 'Updated by another user' })
          .expect(404);
      });

      it('should enqueue a background job when a task is completed', async () => {
        const hashedPassword = await bcrypt.hash('password123', 10);
        const user = await prisma.user.create({
          data: {
            email: 'complete-task@example.com',
            password: hashedPassword,
          },
        });

        const loginRes = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'complete-task@example.com',
            password: 'password123',
          });

        const accessToken = (loginRes.body as LoginResponse).access_token;

        const task = await prisma.task.create({
          data: {
            title: 'Task to be completed',
            ownerId: user.id,
          },
        });

        await request(app.getHttpServer())
          .patch(`/tasks/${task.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ status: 'COMPLETED' })
          .expect(200);

        expect(
          mockNotificationsProducerService.enqueueTaskCompletedNotification,
        ).toHaveBeenCalledWith(expect.objectContaining({ id: task.id }));
      });
    });

    describe('DELETE /tasks/:id', () => {
      it('should delete a task for the authenticated user', async () => {
        const hashedPassword = await bcrypt.hash('password123', 10);
        const user = await prisma.user.create({
          data: {
            email: 'delete-task@example.com',
            password: hashedPassword,
          },
        });

        const loginRes = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'delete-task@example.com', password: 'password123' });

        const accessToken = (loginRes.body as LoginResponse).access_token;

        const task = await prisma.task.create({
          data: {
            title: 'Task to be deleted',
            ownerId: user.id,
          },
        });

        return request(app.getHttpServer())
          .delete(`/tasks/${task.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(204);
      });

      it('should return 404 if a user tries to delete a task owned by another user', async () => {
        const hashedPassword = await bcrypt.hash('password123', 10);
        const user = await prisma.user.create({
          data: {
            email: 'owner-delete@example.com',
            password: hashedPassword,
          },
        });

        await prisma.user.create({
          data: {
            email: 'another-user-delete@example.com',
            password: hashedPassword,
          },
        });

        const loginRes = await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'another-user-delete@example.com',
            password: 'password123',
          });

        const accessToken = (loginRes.body as LoginResponse).access_token;

        const task = await prisma.task.create({
          data: {
            title: "Another User's Task to Delete",
            ownerId: user.id,
          },
        });

        return request(app.getHttpServer())
          .delete(`/tasks/${task.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(404);
      });
    });
  });

  describe('Comments', () => {
    it('should add a comment to a task', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = await prisma.user.create({
        data: {
          email: 'comment-user@example.com',
          password: hashedPassword,
        },
      });

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'comment-user@example.com', password: 'password123' });

      const accessToken = (loginRes.body as LoginResponse).access_token;

      const task = await prisma.task.create({
        data: {
          title: 'Task to be commented on',
          ownerId: user.id,
        },
      });

      return request(app.getHttpServer())
        .post(`/tasks/${task.id}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'This is a great task!' })
        .expect(201)
        .then((res) => {
          const body = res.body as CommentResponse;
          expect(body).toHaveProperty('id');
          expect(body.content).toBe('This is a great task!');
        });
    });

    it('should get paginated comments for a task', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = await prisma.user.create({
        data: {
          email: 'comment-list-user@example.com',
          password: hashedPassword,
        },
      });

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'comment-list-user@example.com',
          password: 'password123',
        });

      const accessToken = (loginRes.body as LoginResponse).access_token;

      const task = await prisma.task.create({
        data: {
          title: 'Task with many comments',
          ownerId: user.id,
        },
      });

      for (let i = 1; i <= 15; i++) {
        await prisma.comment.create({
          data: {
            content: `Comment ${i}`,
            taskId: task.id,
            authorId: user.id,
          },
        });
      }

      return request(app.getHttpServer())
        .get(`/tasks/${task.id}/comments?page=2&limit=5`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .then((res) => {
          const body = res.body as PaginatedCommentResponse;
          expect(body.total).toBe(15);
          expect(body.page).toBe(2);
          expect(body.limit).toBe(5);
          expect(body.data.length).toBe(5);
          expect(body.data[0].content).toBe('Comment 6');
        });
    });
  });
});
