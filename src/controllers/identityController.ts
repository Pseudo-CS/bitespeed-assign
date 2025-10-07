import { Request, Response, NextFunction } from 'express';
import { Database } from '../database/connection';
import { IdentityReconciliationService } from '../services/IdentityReconciliationService';
import { RequestValidator, ValidationError } from '../utils/validators';
import { IdentifyRequest } from '../types';

export class IdentityController {
  private identityService: IdentityReconciliationService;

  constructor(database: Database) {
    this.identityService = new IdentityReconciliationService(database);
  }

  public async identify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body
      const validation = RequestValidator.validateIdentifyRequest(req.body);
      
      if (!validation.isValid) {
        res.status(400).json({
          error: 'Validation failed',
          details: validation.errors,
        });
        return;
      }

      const identifyRequest: IdentifyRequest = {
        email: req.body.email,
        phoneNumber: req.body.phoneNumber,
      };

      // Process the identity reconciliation
      const result = await this.identityService.identify(identifyRequest);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

// Error handling middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', error);

  if (error.message.includes('SQLITE_CONSTRAINT')) {
    res.status(400).json({
      error: 'Database constraint violation',
      message: 'Invalid data provided',
    });
    return;
  }

  if (error.message.includes('Database error')) {
    res.status(500).json({
      error: 'Database error',
      message: 'An error occurred while processing your request',
    });
    return;
  }

  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred',
  });
};