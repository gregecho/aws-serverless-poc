import { UserRepository } from '@@repositories/user/UserRepository';
import type { UserBody, UserResponse } from '@@schemas/user/userSchema';

export class UserService {
  constructor(private readonly repository: UserRepository) {}

  async createUser(user: UserBody): Promise<UserResponse> {
    return this.repository.save(user);
  }

  async getUser(userId: string): Promise<UserResponse> {
    return this.repository.get(userId);
  }
}

export function createUserService(repository: UserRepository) {
  return new UserService(repository);
}
