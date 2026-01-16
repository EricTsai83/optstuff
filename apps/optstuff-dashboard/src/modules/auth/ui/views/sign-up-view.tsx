import { SignUp } from "@workspace/auth/components/sign-up";
import Link from "next/link";

export function SignUpView() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Get started with high-performance image optimization
        </p>
      </div>

      <SignUp />

      <p className="text-muted-foreground text-center text-sm">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="text-primary font-medium hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
