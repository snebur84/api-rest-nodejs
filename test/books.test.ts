import { it, expect, describe, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { execSync } from 'node:child_process';
import { app } from '../src/app';

describe('Books routes', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    execSync('yarn knex migrate:rollback --all');
    execSync('yarn knex migrate:latest');
  });

  it('should be able to create a new book', async () => {
    const response = await request(app.server).post('/books').send({
      title: 'Test Book',
      author: 'Test Author',
      genrer: 'Test Genre',
    });

    expect(response.status).toBe(201);
  });

  describe('GET/books', () => {
    it('should be able to list all books', async () => {
      const book = {
        title: 'Test Book 2',
        author: 'Test Author 2',
        genrer: 'Test Genre 2',
      };

      const createBookResponse = await request(app.server)
        .post('/books')
        .send(book);

      const cookies = createBookResponse.get('Set-Cookie') ?? [];

      const listBooksResponse = await request(app.server)
        .get('/books')
        .set('Cookie', cookies)
        .expect(200);

      expect(listBooksResponse.body.books).toEqual([
        expect.objectContaining(book),
      ]);
    });

    it('should retur status 401 when there is not cookies', async () => {
      const listBooksResponse = await request(app.server).get('/books');

      expect(listBooksResponse.status).toBe(401);
    });
  });

  it('should be able to get a specific book', async () => {
    const book = {
      title: 'Test Book 2',
      author: 'Test Author 2',
      genrer: 'Test Genre 2',
    };

    const createBookResponse = await request(app.server)
      .post('/books')
      .send(book);

    const cookies = createBookResponse.get('Set-Cookie') ?? [];

    const listBooksResponse = await request(app.server)
      .get('/books')
      .set('Cookie', cookies)
      .expect(200);

    const bookId = listBooksResponse.body.books[0].id;

    const getBookResponse = await request(app.server)
      .get(`/books/${bookId}`)
      .set('Cookie', cookies)
      .expect(200);

    expect(getBookResponse.body.book).toEqual(expect.objectContaining(book));
  });
  it.todo('should be able to edit a specific book', () => {});
  it.todo('should be able to delete a specific book', () => {});
});
