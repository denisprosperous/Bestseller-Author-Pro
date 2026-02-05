import { useState } from "react";
import { Form, Link, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/reset-password";
import { AuthService } from "~/services/auth-service";
import { Button } from "~/components/ui/button/button";
import { Input } from "~/components/ui/input/input";
import { Label } from "~/components/ui/label/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card/card";
import { Alert, AlertDescription } from "~/components/ui/alert/alert";
import styles from "./reset-password.module.css";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Reset Password - Bestseller Author Pro" },
    { name: "description", content: "Set your new password" },
  ];
}

export async function clientAction({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return {
      error: "Both password fields are required",
      success: false,
    };
  }

  if (password !== confirmPassword) {
    return {
      error: "Passwords do not match",
      success: false,
    };
  }

  if (password.length < 6) {
    return {
      error: "Password must be at least 6 characters long",
      success: false,
    };
  }

  const { error } = await AuthService.updatePassword(password);
  
  if (error) {
    return {
      error,
      success: false,
    };
  }

  return {
    success: true,
    message: "Password updated successfully! You can now sign in with your new password.",
  };
}

export default function ResetPassword() {
  const actionData = useActionData<typeof clientAction>();
  const navigation = useNavigation();

  const isSubmitting = navigation.state === "submitting";

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Card className={styles.card}>
          <CardHeader className={styles.header}>
            <CardTitle className={styles.title}>Set New Password</CardTitle>
            <CardDescription className={styles.description}>
              Enter your new password below
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
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your new password"
                    required
                    disabled={isSubmitting}
                    minLength={6}
                  />
                </div>

                <div className={styles.field}>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your new password"
                    required
                    disabled={isSubmitting}
                    minLength={6}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className={styles.submitButton}
                >
                  {isSubmitting ? "Updating..." : "Update Password"}
                </Button>
              </Form>
            )}

            <div className={styles.footer}>
              <Link to="/login" className={styles.backLink}>
                {actionData?.success ? "Go to Sign In" : "Back to Sign In"}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}