import * as bcrypt from 'bcryptjs';
import { SortOrder } from 'mongoose';

export async function hashPasswordHelper(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePasswordHelper(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function getSortOptions(sortBy: string, sortDirection: 'asc' | 'desc', allowedSortFields: string[]): { [key: string]: SortOrder } {
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const sortOrder: SortOrder = sortDirection === 'desc' ? -1 : 1;
  return { [sortField]: sortOrder };
}