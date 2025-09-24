# Taskify API

This is a RESTful API for a simple task management application, built with NestJS, Prisma, and PostgreSQL. It includes features for user authentication, task management, background job processing, and more.

## Features

- **User Authentication**: User registration and login with JWT-based authentication.
- **Task Management**: Authenticated users can perform full CRUD operations (Create, Read, Update, Delete) on their own tasks.
- **Pagination**: The `GET /tasks` and `GET /tasks/:taskId/comments` endpoints are paginated.
- **Filtering & Searching**: The `GET /tasks` endpoint supports filtering by status and searching by title or description.
- **Comments**: Users can add comments to tasks.
- **Background Jobs**: When a task is marked as `COMPLETED`, a background job is enqueued using BullMQ and Redis to simulate a notification.
- **Error Handling**: A global exception filter handles database constraint errors gracefully.
- **Containerization**: The entire application stack (app, database, Redis) is containerized with Docker and managed with Docker Compose.

## Prerequisites

- Node.js (v20 or higher)
- Yarn
- Docker and Docker Compose

## Getting Started

There are two ways to run the application: with Docker (recommended) or locally.

### Running with Docker (Recommended)

This is the easiest way to get started, as it sets up the database and Redis instance for you.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/tobisupreme/taskify/
    cd taskify
    ```

2.  **Set up environment variables:**
    Copy the Docker environment template. `docker-compose` will use this `.env` file by default.
    ```bash
    cp .env.example.docker .env.docker
    ```

3.  **Build and run the containers:**
    ```bash
    docker-compose up --build
    ```
    This command will build the Docker image, start the application, PostgreSQL, and Redis containers, and automatically apply database migrations.

4.  The API will be available at `http://localhost:3000`.

### Running Locally

1.  **Setup PostgreSQL and Redis:**
    Ensure you have a local PostgreSQL instance and a Redis instance running. Create a PostgreSQL database named `taskify`.

2.  **Install dependencies:**
    ```bash
    yarn install
    ```

3.  **Environment Variables:**
    Copy the development environment template.
    ```bash
    cp .env.example.development .env.development
    ```
    Update the `.env.development` file if your local database or Redis setup is different from the defaults.

4.  **Apply database migrations:**
    ```bash
    yarn prisma migrate dev
    ```

5.  **Seed the database (optional):**
    To populate the database with some initial data, run the seed script:
    ```bash
    yarn prisma:seed
    ```

6.  **Start the application:**
    ```bash
    yarn start:dev
    ```

## Running Tests

To run the end-to-end tests, you first need to set up a separate test database.

1.  **Set up environment variables for testing:**
    ```bash
    cp .env.example.test .env.test
    ```
    Update `.env.test` if your local database configuration is different.

2.  **Apply migrations to the test database:**
    ```bash
    yarn test:setup
    ```

3.  **Run the tests:**
    Once the test database is set up, you can run the E2E tests:
    ```bash
    yarn test:e2e
    ```

## API Documentation

API documentation is available via Swagger UI. Once the application is running, you can access it at:

`http://localhost:3000/swagger`

## Example API Requests

Here are some example `cURL` commands for interacting with the API. Replace `YOUR_JWT_TOKEN` with the `access_token` received from the login endpoint.

### Authentication

**Register a new user:**

```bash
curl -X POST http://localhost:3000/auth/register \
-H "Content-Type: application/json" \
-d '{"email": "newuser@example.com", "password": "password123"}'
```

**Log in:**

```bash
curl -X POST http://localhost:3000/auth/login \
-H "Content-Type: application/json" \
-d '{"email": "newuser@example.com", "password": "password123"}'
```

### Tasks

**Create a new task:**

```bash
curl -X POST http://localhost:3000/tasks \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_JWT_TOKEN" \
-d '{"title": "My first task", "description": "This is a test."}'
```

**Get all tasks (with pagination and filtering):**

```bash
curl -X GET http://localhost:3000/tasks?page=1&limit=5&status=PENDING \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Update a task:**

```bash
curl -X PATCH http://localhost:3000/tasks/1 \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_JWT_TOKEN" \
-d '{"status": "COMPLETED"}'
```

### Comments

**Add a comment to a task:**

```bash
curl -X POST http://localhost:3000/tasks/1/comments \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_JWT_TOKEN" \
-d '{"content": "This is a comment."}'
```

**Get all comments for a task:**

```bash
curl -X GET http://localhost:3000/tasks/1/comments \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```
