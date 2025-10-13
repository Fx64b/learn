export class AppError extends Error {
    constructor(
        public message: string,
        public statusCode: number = 500,
        public code: string = 'INTERNAL_ERROR'
    ) {
        super(message)
        this.name = 'AppError'
    }
}

export class AuthenticationError extends AppError {
    constructor(message: string = 'Authentication required') {
        super(message, 401, 'AUTHENTICATION_REQUIRED')
    }
}

export class AuthorizationError extends AppError {
    constructor(message: string = 'Not authorized to perform this action') {
        super(message, 403, 'UNAUTHORIZED')
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = 'Resource not found') {
        super(message, 404, 'NOT_FOUND')
    }
}
