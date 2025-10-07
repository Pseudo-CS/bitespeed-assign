import express from 'express';
import { Database } from '../database/connection';
import { IdentityController, errorHandler } from '../controllers/identityController';

// Create the identity routes
export function createIdentityRoutes(database: Database): express.Router {
  const router = express.Router();
  const controller = new IdentityController(database);

  router.post('/identify', controller.identify.bind(controller));

  return router;
}

export { errorHandler };