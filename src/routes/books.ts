import { FastifyInstance } from 'fastify';
import { knex } from '../db';
import { z } from 'zod';
import { randomUUID } from 'crypto';

// http

// controller
// service
// repository

// SOLID

// unit
// integration
// e2e

export async function booksRouter(app: FastifyInstance) {
  app.get(
    '/',
    {
      preHandler: [app.authenticate],
    },
    async (request) => {
      const { id } = request.user;

      const books = await knex('books').where('user_id', id).select();

      return { books };
    },
  );

  app.get(
    '/:id',
    {
      preHandler: [app.authenticate],
    },
    async (request) => {
      const { id: user_id } = request.user;

      const getBookParamsSchema = z.object({
        id: z.string().uuid(),
      });

      const { id } = getBookParamsSchema.parse(request.params);

      const book = await knex('books')
        .where({
          id,
          user_id,
        })
        .first();

      return { book };
    },
  );

  app.post(
    '/',
    {
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const createBookBodySchema = z.object({
        title: z.string(),
        genrer: z.string(),
        author: z.string(),
      });

      const { title, author, genrer } = createBookBodySchema.parse(
        request.body,
      );

      await knex('books').insert({
        id: randomUUID(),
        title,
        author,
        genrer,
        user_id: request.user.id,
      });

      return reply.status(201).send();
    },
  );

  app.put(
    '/:id',
    {
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const updateBookBodySchema = z.object({
        id: z.string().uuid(),
        title: z.string(),
        genrer: z.string(),
        author: z.string(),
      });
  
      const { id } = updateBookBodySchema.parse(request.params);
  
      try {
        // Valida o corpo da requisição
        const dataToUpdate = updateBookBodySchema.parse(request.body);
  
        // Testa se os campos a serem alterados foram enviados
        if (Object.keys(dataToUpdate).length === 0) {
          return reply.status(400).send({ error: 'No fields provided for update' });
        }
  
        // Atualiza o livro no banco de dados
        const updatedRows = await knex('books')
          .where({ id })
          .andWhere({ user_id: request.user.id })
          .update(dataToUpdate);

        // Valida se a atualização foi possível  
        if (updatedRows === 0) {
          return reply.status(404).send({ error: 'User not found or not authorized' });
        }
        
        // Retorna OK para alteração bem sucedida
        return reply.status(200).send({ message: 'User updated successfully' });
      } catch { // Retorna erro na requisição
        return reply.status(400).send({ error: 'Invalid request' });
      }
    },
  );
  

  app.delete(
    '/:id',
    {
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      const { id: user_id } = request.user;

      const deleteBookParamsSchema = z.object({
        id: z.string().uuid(),
      });

      const { id } = deleteBookParamsSchema.parse(request.params);

      // Deleta livro no banco
      const deletedBook = await knex('books')
        .where({
          id,
          user_id,
        })
        .del();

        // Valida se houve falha na deleção
        if (deletedBook === 0) {
          return reply.status(404).send({ error: 'User not found or not authorized' });
        }
        
        // Retorna OK para caso de deleção bem sucedida
        return reply.status(200).send({ message: 'User deleted successfully' });
    },
  );
}
