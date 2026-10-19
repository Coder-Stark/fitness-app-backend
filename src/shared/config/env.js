import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  CLIENT_URL: z.string().min(1, "CLIENT_URL is required"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(parsed.error.issues.map((i) => `- ${i.path.join(".")}: ${i.message}`).join("\n"));
  process.exit(1);
}

export const env = parsed.data;