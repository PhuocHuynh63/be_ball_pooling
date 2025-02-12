import * as bcrypt from 'bcryptjs';

export async function hashPasswordHelper(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePasswordHelper(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}