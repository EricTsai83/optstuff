import { SignIn as ClerkSignIn } from "@clerk/nextjs";

export const SignIn = () => (
  <ClerkSignIn
    routing="path"
    path="/dashboard/sign-in"
    signUpUrl="/dashboard/sign-up"
    appearance={{
      elements: {
        header: "hidden",
      },
    }}
  />
);
