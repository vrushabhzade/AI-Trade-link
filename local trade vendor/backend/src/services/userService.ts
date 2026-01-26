import { prisma } from '../config/database';
import { User, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

export interface CreateUserData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role: Role;
  preferredLanguage?: string;
  location?: {
    city: string;
    country: string;
    coordinates: [number, number];
  };
}

export interface UpdateUserData {
  fullName?: string;
  phone?: string;
  preferredLanguage?: string;
  location?: {
    city: string;
    country: string;
    coordinates: [number, number];
  };
}

export class UserService {
  async createUser(userData: CreateUserData): Promise<User> {
    const passwordHash = await bcrypt.hash(userData.password, 12);
    
    return prisma.user.create({
      data: {
        email: userData.email,
        passwordHash,
        fullName: userData.fullName,
        phone: userData.phone,
        role: userData.role,
        preferredLanguage: userData.preferredLanguage || 'en',
        location: userData.location || undefined,
      },
    });
  }

  async getUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
      include: {
        vendor: true,
      },
    });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
      include: {
        vendor: true,
      },
    });
  }

  async updateUser(id: string, userData: UpdateUserData): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: userData,
    });
  }

  async deleteUser(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }
}

export const userService = new UserService();