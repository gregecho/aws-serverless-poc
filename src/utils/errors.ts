export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public errorCode: string,
    public details?: any,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const Errors = {
  NOT_FOUND: (resource: string) =>
    new AppError(404, `${resource} not found`, 'RESOURCE_NOT_FOUND'),
  BAD_REQUEST: (msg: string) => new AppError(400, msg, 'INVALID_INPUT'),
  UNAUTHORIZED: () => new AppError(401, 'Unauthorized access', 'UNAUTHORIZED'),
  INTERNAL: () => new AppError(500, 'Internal Server Error', 'INTERNAL_ERROR'),
};
