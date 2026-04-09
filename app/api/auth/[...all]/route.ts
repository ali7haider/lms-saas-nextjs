import { auth } from "@/lib/auth"; // path to your auth file
import { toNextJsHandler } from "better-auth/next-js";
import ip from "@arcjet/ip";

import {
  ArcjetDecision,
  BotOptions,
  detectBot,
  EmailOptions,
  protectSignup,
  ProtectSignupOptions,
  slidingWindow,
  SlidingWindowRateLimitOptions,
} from "@arcjet/next";

import { NextRequest } from "next/server";
import { authClient } from "@/lib/auth-client";
import arcjet from "@/lib/arcjet";

const emailOptions = {
  mode: "LIVE",
  deny: ["DISPOSABLE", "INVALID", "NO_MX_RECORDS"],
} satisfies EmailOptions;

const botOptions = {
  mode: "LIVE",
  allow: [],
} satisfies BotOptions;

const rateLimitOptions = {
  mode: "LIVE",
  interval: "2m",
  max: 5,
} satisfies SlidingWindowRateLimitOptions<[]>;

const signupOptions = {
  email: emailOptions,
  bots: botOptions,
  rateLimit: rateLimitOptions,
} satisfies ProtectSignupOptions<[]>;

async function protect(req: NextRequest): Promise<ArcjetDecision> {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  const userId = session?.user?.id || ip(req) || "127.0.0.1";

  const isSignupRoute = req.nextUrl.pathname.startsWith("/api/auth/sign-up");

  if (isSignupRoute) {
    const { body } = await req.clone().json();

    if (typeof body?.email === "string") {
      return arcjet.withRule(protectSignup(signupOptions)).protect(req, {
        email: body.email,
        fingerprint: userId,
      });
    }

    return arcjet
      .withRule(detectBot(botOptions))
      .withRule(slidingWindow(rateLimitOptions))
      .protect(req, { fingerprint: userId });
  }

  return arcjet
    .withRule(detectBot(botOptions))
    .protect(req, { fingerprint: userId });
}


const authHandlers = toNextJsHandler(auth);

export const { GET } = authHandlers;

export const POST = async (req: NextRequest) => {
  const decision = await protect(req);
  console.log("Arcjet decision:", decision);

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return new Response("Too many requests. Please try again later.", {
        status: 429,
      });
    }

    if (decision.reason.isEmail()) {
      let message = "Your request was denied. Please try again.";

      if (decision.reason.emailTypes.includes("INVALID")) {
        message = "The email address is invalid. Please provide a valid email.";
      } else if (decision.reason.emailTypes.includes("DISPOSABLE")) {
        message =
          "Disposable email addresses are not allowed. Please use a different email.";
      } else if (decision.reason.emailTypes.includes("NO_MX_RECORDS")) {
        message =
          "The email domain cannot receive emails. Please use a different email.";
      }

      return Response.json({ message }, { status: 400 });
    }

    return new Response("Forbidden", { status: 403 });
  }

  return authHandlers.POST(req);
};
