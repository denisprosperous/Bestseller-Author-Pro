import { useState } from "react";
import { Form, Link, useActionData, useNavigation, redirect, json } from "react-router";
import type { ActionFunctionArgs } from "@react-router/node";
import { AuthService } from "~/services/auth-service";
import { Button } from "~/components/ui/button/button";
import { Input } from "~/components/ui/input/input";
import { Label } from "~/components/ui/label/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card/card";
import { Alert, AlertDescription } from "~/components/ui/alert/alert";
import styles from "./login.module.css";

export function meta() {
  return [
    { title: "Login - Bestseller Author Pro" },
    { name: "description", content: "Sign in to your account to create amazing ebooks with AI" },
  ];
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const intent = formData.get("intent") as string;

  if (!email || !password) {
    return {
      error: "Email and password are required",
      success: false,
    };
  }

  if (intent === "signin") {
    const { user, error } = await AuthService.signIn(email, password);
    
    if (error) {
      return {
        error,
        success: false,
      };
    }

    if (user) {
      // Redirect to home page after successful login
      return redirect("/");
    }
  }

  if (intent === "signup") {
    const { user, error } = await AuthService.signUp(email, password);
    
    if (error) {
      return {
        error,
        success: false,
      };
    }

    if (user) {
      return {
        success: true,
        message: "Account created successfully! Please check your email to verify your account.",
      };
    }
  }

  return {
    error: "An unexpected error occurred",
    success: false,
  };
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [isSignUp, setIsSignUp] = useState(false);

  const isSubmitting = navigation.state === "submitting";

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Card className={styles.card}>
          <CardHeader className={styles.header}>
            <CardTitle className={styles.title}>
              {isSignUp ? "Create Account" : "Welcome Back"}
            </CardTitle>
            <CardDescription className={styles.description}>
              {isSignUp 
                ? "Sign up to start creating amazing ebooks with AI" 
                : "Sign in to your account to continue creating"
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className={styles.cardContent}>
            {actionData?.error && (
              <Alert className={styles.alert}>
                <AlertDescription>{actionData.error}</AlertDescription>
              </Alert>
            )}
            
            {actionData?.success && actionData?.message && (
              <Alert className={styles.successAlert}>
                <AlertDescription>{actionData.message}</AlertDescription>
              </Alert>
            )}

            <Form method="post" className={styles.form}>
              <div className={styles.field}>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles.field}>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                  disabled={isSubmitting}
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                name="intent"
                value={isSignUp ? "signup" : "signin"}
                disabled={isSubmitting}
                className={styles.submitButton}
              >
                {isSubmitting 
                  ? (isSignUp ? "Creating Account..." : "Signing In...") 
                  : (isSignUp ? "Create Account" : "Sign In")
                }
              </Button>
            </Form>

            <div className={styles.footer}>
              <p className={styles.switchText}>
                {isSignUp ? "Already have an account?" : "Don't have an account?"}
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className={styles.switchButton}
                  disabled={isSubmitting}
                >
                  {isSignUp ? "Sign In" : "Sign Up"}
                </button>
              </p>
              
              {!isSignUp && (
                <Link to="/forgot-password" className={styles.forgotLink}>
                  Forgot your password?
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}