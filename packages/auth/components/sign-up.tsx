import { SignUp as ClerkSignUp } from "@clerk/nextjs";

export const SignUp = () => (
  <ClerkSignUp
    routing="path"
    path="/sign-up"
    signInUrl="/sign-in"
    appearance={{
      elements: {
        header: "hidden",
      },
    }}
  />
);
