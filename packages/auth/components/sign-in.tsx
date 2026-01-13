import { SignIn as ClerkSignIn } from "@clerk/nextjs";

export const SignIn = () => (
  <ClerkSignIn
    routing="path"
    path="/sign-in"
    signUpUrl="/sign-up"
    appearance={{
      elements: {
        header: "hidden",
      },
    }}
  />
);
