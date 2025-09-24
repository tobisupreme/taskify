import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 10);

  const user1 = await prisma.user.create({
    data: {
      email: 'segun@example.com',
      password: hashedPassword,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'nkechi@example.com',
      password: hashedPassword,
    },
  });

  const task1 = await prisma.task.create({
    data: {
      title: "Segun's first task",
      description: 'This is a description for the first task.',
      ownerId: user1.id,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: "Nkechi's important task",
      description: 'This task is very important.',
      ownerId: user2.id,
      status: 'IN_PROGRESS',
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Great start, Segun!',
      taskId: task1.id,
      authorId: user2.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: "I'm working on it.",
      taskId: task2.id,
      authorId: user2.id,
    },
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  .finally(async () => {
    await prisma.$disconnect();
  });
