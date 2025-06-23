import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
      profileImageUrl?: string;
    };
    userId?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
        profileImageUrl?: string;
        isAdmin?: boolean;
      } | null;
    }
  }
}

export {};