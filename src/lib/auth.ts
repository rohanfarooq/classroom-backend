import {betterAuth} from "better-auth";
import {drizzleAdapter} from "better-auth/adapters/drizzle";
import {db} from "../db";
import * as schema from "../db/schema/auth";

const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL;
if (!BETTER_AUTH_SECRET) {
    throw new Error("BETTER_AUTH_SECRET is required");
}
if (!FRONTEND_URL) {
    throw new Error("FRONTEND_URL is required");
}

export const auth = betterAuth({
    secret: BETTER_AUTH_SECRET,
    trustedOrigins: [FRONTEND_URL],
    database: drizzleAdapter(db, {
        provider: "pg",
        schema
    }),
    emailAndPassword: {
        enabled: true
    },
    user: {
        additionalFields: {
            role: {
                type: "string", required: true, default: "student", input: true
            },
            imageCldPubId: {
                type: "string", required: false, input: true
            }
        }
    }
});