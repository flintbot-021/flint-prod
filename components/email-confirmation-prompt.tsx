"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, RefreshCw } from "lucide-react";

interface EmailConfirmationPromptProps {
  userEmail: string;
  onResendSuccess?: () => void;
}

export function EmailConfirmationPrompt({ 
  userEmail, 
  onResendSuccess 
}: EmailConfirmationPromptProps) {
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const handleResendConfirmation = async () => {
    setIsResending(true);
    setResendMessage(null);
    
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`
        }
      });

      if (error) {
        throw error;
      }

      setResendMessage("Confirmation email sent! Please check your inbox.");
      onResendSuccess?.();
    } catch (error) {
      setResendMessage(
        error instanceof Error 
          ? error.message 
          : "Failed to resend confirmation email. Please try again."
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
          <Mail className="h-6 w-6 text-blue-600" />
        </div>
        <CardTitle className="text-2xl font-bold">Confirm Your Email</CardTitle>
        <CardDescription>
          We've sent a confirmation email to <strong>{userEmail}</strong>. 
          Please click the link in the email to activate your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-sm text-yellow-800">
            <strong>Important:</strong> You won't be able to access your dashboard 
            and create campaigns until you confirm your email address.
          </p>
        </div>
        
        {resendMessage && (
          <div className={`rounded-md p-4 ${
            resendMessage.includes('sent') 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <p className={`text-sm ${
              resendMessage.includes('sent') ? 'text-green-800' : 'text-red-800'
            }`}>
              {resendMessage}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Button
            onClick={handleResendConfirmation}
            disabled={isResending}
            className="w-full"
          >
            {isResending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Resend Confirmation Email
              </>
            )}
          </Button>
          
          <div className="text-center text-sm text-muted-foreground">
            Already confirmed? Try refreshing the page.
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 