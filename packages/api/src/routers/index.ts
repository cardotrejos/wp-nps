import type { RouterClient } from "@orpc/server";

import { protectedProcedure, publicProcedure } from "../index";
import { onboardingRouter } from "./onboarding";
import { whatsappRouter } from "./whatsapp";
import { surveyTemplateRouter } from "./survey-template";
import { surveyRouter } from "./survey";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => {
    return "OK";
  }),
  privateData: protectedProcedure.handler(({ context }) => {
    return {
      message: "This is private",
      user: context.session?.user,
    };
  }),
  onboarding: onboardingRouter,
  whatsapp: whatsappRouter,
  surveyTemplate: surveyTemplateRouter,
  survey: surveyRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
