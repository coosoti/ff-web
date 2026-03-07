// src/services/auth.service.ts
import { supabase } from '../config/database';
import { cacheService } from './cache.service';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/environment';

interface RegisterUserData {
  email: string;
  password: string;
  name: string;
  monthly_income: number;
  dependents: number;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    monthly_income: number;
  };
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private readonly SALT_ROUNDS = 10;
  private readonly ACCESS_TOKEN_EXPIRY = '15m';
  private readonly REFRESH_TOKEN_EXPIRY = '7d';

  async register(data: RegisterUserData): Promise<AuthResponse> {
    try {
      // Check if user exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', data.email)
        .single();

      if (existingUser) {
        throw new Error('User already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, this.SALT_ROUNDS);

      // Create user in Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) throw authError;

      // Create profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.user?.id,
          email: data.email,
          name: data.name,
          monthly_income: data.monthly_income,
          dependents: data.dependents,
        })
        .select('id, email, name, monthly_income')
        .single();

      if (profileError) throw profileError;

      // Auto-create default budget categories
      await this.createDefaultCategories(profile.id, data.monthly_income);

      // Generate tokens
      const tokens = this.generateTokens(profile.id, profile.email);

      logger.info(`User registered: ${profile.email}`);

      return {
        user: profile,
        ...tokens,
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      // Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Get profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, name, monthly_income')
        .eq('id', authData.user?.id)
        .single();

      if (profileError) throw profileError;

      // Update last login
      await supabase
        .from('profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', profile.id);

      // Generate tokens
      const tokens = this.generateTokens(profile.id, profile.email);

      logger.info(`User logged in: ${profile.email}`);

      return {
        user: profile,
        ...tokens,
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  async refreshToken(token: string): Promise<{ accessToken: string }> {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      
      // Check if user still exists
      const { data: user } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', decoded.userId)
        .single();

      if (!user) {
        throw new Error('User not found');
      }

      // Generate new access token
      const accessToken = jwt.sign(
        { userId: user.id },
        env.JWT_SECRET,
        { expiresIn: this.ACCESS_TOKEN_EXPIRY }
      );

      return { accessToken };
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw error;
    }
  }

  private generateTokens(userId: string, email: string) {
    const accessToken = jwt.sign(
      { userId, email },
      env.JWT_SECRET,
      { expiresIn: this.ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { userId, email },
      env.JWT_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRY }
    );

    return { accessToken, refreshToken };
  }

  private async createDefaultCategories(userId: string, monthlyIncome: number) {
    const needsAmount = monthlyIncome * 0.5;
    const wantsAmount = monthlyIncome * 0.3;
    const growthAmount = monthlyIncome * 0.2;

    const needsCategories = [
      'Housing', 'Food', 'Transport', 'Utilities', 
      'Healthcare', 'Insurance', 'Education'
    ];
    
    const wantsCategories = [
      'Entertainment', 'Dining', 'Personal Care'
    ];
    
    const growthCategories = [
      'Emergency Fund', 'Investments'
    ];

    const categories = [
      ...needsCategories.map(name => ({
        user_id: userId,
        name,
        type: 'needs',
        budgeted_amount: needsAmount / needsCategories.length,
        is_default: true,
        month: new Date().toISOString().split('T')[0],
      })),
      ...wantsCategories.map(name => ({
        user_id: userId,
        name,
        type: 'wants',
        budgeted_amount: wantsAmount / wantsCategories.length,
        is_default: true,
        month: new Date().toISOString().split('T')[0],
      })),
      ...growthCategories.map(name => ({
        user_id: userId,
        name,
        type: 'growth',
        budgeted_amount: growthAmount / growthCategories.length,
        is_default: true,
        month: new Date().toISOString().split('T')[0],
      })),
    ];

    const { error } = await supabase
      .from('budget_categories')
      .insert(categories);

    if (error) {
      logger.error('Error creating default categories:', error);
    }
  }
}

export const authService = new AuthService();