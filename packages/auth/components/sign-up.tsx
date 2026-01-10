import { SignUp as ClerkSignUp } from "@clerk/nextjs";

export const SignUp = () => (
  <ClerkSignUp
    routing="path"
    path="/dashboard/sign-up"
    signInUrl="/dashboard/sign-in"
    appearance={{
      elements: {
        header: "hidden",
      },
    }}
  />
);
