// src/validators/auth.validator.ts
import Joi from 'joi';

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().min(2).max(50).required(),
  monthly_income: Joi.number().positive().required(),
  dependents: Joi.number().integer().min(0).max(20).default(0),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const refreshSchema = Joi.object({
  token: Joi.string().required(),
});