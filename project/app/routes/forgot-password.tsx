import { useState } from "react";
import { Form, Link, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/forgot-password";
import { AuthService } from "~/services/auth-service";
import { Button } from "~/components/ui/button/button";
import { Input } from "~/components/ui/input/input";
import { Label } from "~/components/ui/label/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card/card";
import { Alert, AlertDescription } from "~/components/ui/alert/alert";
import styles from "./forgot-password.module.css";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Reset Password - Bestseller Author Pro" },
    { name: "description", content: "Reset your password to regain access to your account" },
  ];
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;

  if (!email) {
    return {
      error: "Email is required",
      success: false,
    };
  }

  const { error } = await AuthService.resetPassword(email);
  
  if (error) {
    return {
      error,
      success: false,
    };
  }

  return {
    success: true,
    message: "Password reset email sent! Please check your inbox and follow the instructions.",
  };
}

export default function ForgotPassword() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  const isSubmitting = navigation.state === "submitting";

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Card className={styles.card}>
          <CardHeader className={styles.header}>
            <CardTitle className={styles.title}>Reset Password</CardTitle>
            <CardDescription className={styles.description}>
              Enter your email address and we'll send you a link to reset your password
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

            {!actionData?.success && (
              <Form method="post" className={styles.form}>
                <div className={styles.field}>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email address"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className={styles.submitButton}
                >
                  {isSubmitting ? "Sending..." : "Send Reset Link"}
                </Button>
              </Form>
            )}

            <div className={styles.footer}>
              <Link to="/login" className={styles.backLink}>
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}