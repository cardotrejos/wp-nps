import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";
import { generateSlug } from "@/lib/utils";

import Loader from "./loader";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

// AC #3, #4, #5: Validation schema with email, password (min 8 chars), and organization name
const signUpSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email" }),
  password: z.string().min(8, "Password must be at least 8 characters"),
  organizationName: z.string().min(1, "Organization name is required"),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function SignUpForm({
  onSwitchToSignIn,
}: {
  onSwitchToSignIn: () => void;
}) {
  const navigate = useNavigate({
    from: "/",
  });
  const { isPending } = authClient.useSession();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      organizationName: "",
    } as SignUpFormValues,
    onSubmit: async ({ value }) => {
      try {
        // AC #1: Step 1 - Create user account
        const { error: signupError } = await authClient.signUp.email({
          email: value.email,
          password: value.password,
          name: value.email.split("@")[0] ?? "User", // Default name from email
        });

        if (signupError) {
          // AC #2: Handle duplicate email error
          if (
            signupError.code === "USER_ALREADY_EXISTS" ||
            signupError.message?.toLowerCase().includes("already")
          ) {
            toast.error("Email already registered");
          } else {
            toast.error(signupError.message ?? "Registration failed");
          }
          return;
        }

        // AC #1: Step 2 - Create organization (user is now authenticated)
        let slug = generateSlug(value.organizationName);
        let { data: org, error: orgError } =
          await authClient.organization.create({
            name: value.organizationName,
            slug,
          });

        if (orgError) {
          // Retry logic: If slug collision (likely usage), append random suffix and try once more
          // This prevents "orphaned user" state where user exists but org creation failed due to common name
          // Using 8 chars for better uniqueness: timestamp (4 chars base36) + random (4 chars)
          const randomSuffix = `${Date.now().toString(36).slice(-4)}${Math.random().toString(36).slice(2, 6)}`;
          slug = `${slug}-${randomSuffix}`;

          const retry = await authClient.organization.create({
            name: value.organizationName,
            slug,
          });

          org = retry.data;
          orgError = retry.error;
        }

        if (orgError || !org) {
          // AC #6: If org creation fails, sign out user and show retry message
          await authClient.signOut();
          toast.error("Setup incomplete, please try again");
          return;
        }

        // AC #1: Step 3 - Set as active organization
        await authClient.organization.setActive({ organizationId: org.id });

        // AC #1: Success - show welcome message and redirect to onboarding
        toast.success("Welcome! Let's get you set up");
        navigate({ to: "/onboarding" });
      } catch {
        // AC #4: Handle network errors gracefully
        toast.error("Registration failed. Please try again.");
      }
    },
    validators: {
      onSubmit: signUpSchema,
    },
  });

  if (isPending) {
    return <Loader />;
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-md p-6">
      <h1 className="mb-6 text-center text-3xl font-bold">Create Account</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        {/* Email field - first for cognitive flow (account identity) */}
        <div>
          <form.Field name="email">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Email</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  placeholder="you@example.com"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-sm text-destructive">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>

        {/* Password field - second for cognitive flow (account security) */}
        <div>
          <form.Field name="password">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Password</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  placeholder="At least 8 characters"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-sm text-destructive">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>

        {/* Organization name field - third for cognitive flow (context for the account) */}
        <div>
          <form.Field name="organizationName">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Organization Name</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  placeholder="Your Company Name"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Your company or project name
                </p>
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-sm text-destructive">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>

        {/* Submit button with loading state */}
        <form.Subscribe>
          {(state) => (
            <Button
              type="submit"
              className="w-full"
              disabled={!state.canSubmit || state.isSubmitting}
            >
              {state.isSubmitting ? "Creating your account..." : "Sign Up"}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="mt-4 text-center">
        <Button
          variant="link"
          onClick={onSwitchToSignIn}
          className="text-indigo-600 hover:text-indigo-800"
        >
          Already have an account? Sign In
        </Button>
      </div>
    </div>
  );
}
