import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  secret: process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET || "fallback-secret-for-development",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  },
  advanced: {
    cookiePrefix: "studio",
    useSecureCookies: true
  },
  user: {
    additionalFields: {
      studio_id: {
        type: "string",
        required: false,
        input: false,
      },
      role: {
        type: "string",
        required: false,
        defaultValue: "customer",
        input: false,
      },
      phone: {
        type: "string",
        required: false,
        input: true,
      },
      full_name: {
        type: "string",
        required: false,
        input: true,
      },
      address: {
        type: "string",
        required: false,
        input: false,
      },
      birth_date: {
        type: "date",
        required: false,
        input: false,
      },
      preferences: {
        type: "string", // JSON string
        required: false,
        defaultValue: "{}",
        input: false,
      },
      avatar_url: {
        type: "string",
        required: false,
        input: false,
      },
      is_active: {
        type: "boolean",
        required: false,
        defaultValue: true,
        input: false,
      },
      last_login: {
        type: "date",
        required: false,
        input: false,
      }
    },
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;