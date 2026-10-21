import { z } from "zod";
import { packagePlans } from "./package.config.js";

export const purchaseSchema = z.object({
  planCode: z.enum(packagePlans.map((plan) => plan.code)),
});