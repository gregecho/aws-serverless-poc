import { UserRepository } from '@@repositories/user/UserRepository';
import type { UserBody, UserResponse } from '@@schemas/user/userSchema';

export class UserService {
  constructor(private readonly repository: UserRepository) {}

  async create(body: UserBody): Promise<UserResponse> {
    return this.repository.save(body);
  }

  async getById(id: string): Promise<UserResponse> {
    return this.repository.getById(id);
  }

  async list(
    query?: Record<string, string | undefined>,
  ): Promise<UserResponse[]> {
    return this.repository.list(query);
  }

  async update(id: string, body: Partial<UserBody>): Promise<UserResponse> {
    return this.repository.update(id, body);
  }

  async delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}

export function createUserService(repository: UserRepository): UserService {
  return new UserService(repository);
}
