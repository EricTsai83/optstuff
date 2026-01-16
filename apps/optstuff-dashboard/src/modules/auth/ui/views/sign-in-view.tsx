import { SignIn } from "@workspace/auth/components/sign-in";
import Link from "next/link";

export function SignInView() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Sign in to your account to continue
        </p>
      </div>
      
      <SignIn />

      <p className="text-muted-foreground text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link
          href="/sign-up"
          className="text-primary font-medium hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
