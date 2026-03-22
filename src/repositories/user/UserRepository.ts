import { UserBody, UserResponse } from '@@schemas/user/userSchema';

export interface UserRepository {
  save(user: UserBody): Promise<UserResponse>;
  get(userId: string): Promise<UserResponse>;
}
