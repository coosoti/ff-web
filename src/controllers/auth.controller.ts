// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { logger } from '../utils/logger';
import { cacheService } from '../services/cache.service';

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { email, password, name, monthly_income, dependents } = req.body;

      const result = await authService.register({
        email,
        password,
        name,
        monthly_income,
        dependents,
      });

      res.status(201).json(result);
    } catch (error: any) {
      logger.error('Register controller error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const result = await authService.login(email, password);

      res.json(result);
    } catch (error: any) {
      logger.error('Login controller error:', error);
      res.status(401).json({ error: error.message });
    }
  }

  async refresh(req: Request, res: Response) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ error: 'Refresh token required' });
      }

      const result = await authService.refreshToken(token);
      res.json(result);
    } catch (error: any) {
      logger.error('Refresh controller error:', error);
      res.status(401).json({ error: error.message });
    }
  }

  async me(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;

      // Try cache first
      const cacheKey = cacheService.getUserKey(userId, 'profile');
      const cached = await cacheService.get(cacheKey);

      if (cached) {
        return res.json(cached);
      }

      // Get from database
      const { data: user, error } = await req.db
        .from('profiles')
        .select('id, email, name, monthly_income, dependents, currency, created_at')
        .eq('id', userId)
        .single();

      if (error) throw error;

      // Cache for 5 minutes
      await cacheService.set(cacheKey, user, 300);

      res.json(user);
    } catch (error: any) {
      logger.error('Me controller error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      
      // Clear user cache
      await cacheService.invalidateUserData(userId);

      res.json({ message: 'Logged out successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const authController = new AuthController();