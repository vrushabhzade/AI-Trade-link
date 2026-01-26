import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: errors.array(),
        timestamp: new Date().toISOString()
      }
    });
  }
  next();
};

export const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('role')
    .isIn(['buyer', 'vendor'])
    .withMessage('Role must be either buyer or vendor'),
  body('preferredLanguage')
    .optional()
    .isIn(['en', 'hi', 'es', 'fr', 'ar'])
    .withMessage('Preferred language must be one of: en, hi, es, fr, ar')
];

export const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

export const updateProfileValidation = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('preferredLanguage')
    .optional()
    .isIn(['en', 'hi', 'es', 'fr', 'ar'])
    .withMessage('Preferred language must be one of: en, hi, es, fr, ar'),
  body('location.city')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('City must be between 1 and 100 characters'),
  body('location.country')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Country must be between 1 and 100 characters'),
  body('location.coordinates')
    .optional()
    .isArray({ min: 2, max: 2 })
    .withMessage('Coordinates must be an array of [longitude, latitude]'),
  body('location.coordinates.*')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Coordinates must be valid longitude/latitude values')
];