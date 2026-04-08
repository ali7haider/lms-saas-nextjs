"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export default function VerifyRequest() {
  const [otp, setOtp] = useState("");
  const params = useSearchParams();
  const email = params.get("email") as string;
  const [otpPending, setOtpTransition] = useTransition();
  const router = useRouter();
  const isOtpCompleted = otp.length === 6;

  function verifyOTP() {
    setOtpTransition(async () => {
      await authClient.signIn.emailOtp({
        email: email,
        otp: otp,
        fetchOptions: {
          onSuccess: () => {
            toast.success("Successfully signed in!");
            router.push("/");
          },
          onError: () => {
            toast.error("Invalid OTP. Please try again.");
          },
        },
      });
    });
  }

  return (
    <Card className="w-full mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-xl">Check your email</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          We emailed you a magic link to sign in. Click the link to sign in.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center space-y-6">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={(value) => setOtp(value)}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          <div className="text-sm text-muted-foreground">
            Didn't receive the email? Check your spam folder.
          </div>
        </div>
        <Button
          onClick={verifyOTP}
          disabled={otpPending || !isOtpCompleted}
          className="w-full"
        >
          {otpPending ? (
            <>
              <Loader2 className="animate-spin size-4" />
              <span>Verifying...</span>
            </>
          ) : (
            <>
              <span>Verify Code</span>
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
