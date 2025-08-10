import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useLogin } from '../../hooks/useAuth';
import { Loader2 } from 'lucide-react';

const passwordLoginSchema = z.object({
  contact: z.string().min(1, 'Email or mobile is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const otpLoginSchema = z.object({
  contact: z.string().min(1, 'Email or mobile is required'),
  otp: z.string().regex(/^[0-9]{4,6}$/, 'OTP must be 4-6 digits'),
});

type PasswordLoginData = z.infer<typeof passwordLoginSchema>;
type OTPLoginData = z.infer<typeof otpLoginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { mutate: login, isPending } = useLogin();
  const [activeTab, setActiveTab] = useState('password');

  const passwordForm = useForm<PasswordLoginData>({
    resolver: zodResolver(passwordLoginSchema),
  });

  const otpForm = useForm<OTPLoginData>({
    resolver: zodResolver(otpLoginSchema),
  });

  const onPasswordSubmit = (data: PasswordLoginData) => {
    login(data, {
      onSuccess: () => {
        onSuccess?.();
      },
    });
  };

  const onOTPSubmit = (data: OTPLoginData) => {
    login(data, {
      onSuccess: () => {
        onSuccess?.();
      },
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Access your account using password or OTP
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="otp">OTP</TabsTrigger>
          </TabsList>

          <TabsContent value="password" className="space-y-4">
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact-password">Email or Mobile</Label>
                <Input
                  id="contact-password"
                  placeholder="your@email.com or 9876543210"
                  {...passwordForm.register('contact')}
                  disabled={isPending}
                />
                {passwordForm.formState.errors.contact && (
                  <p className="text-sm text-red-600">
                    {passwordForm.formState.errors.contact.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  {...passwordForm.register('password')}
                  disabled={isPending}
                />
                {passwordForm.formState.errors.password && (
                  <p className="text-sm text-red-600">
                    {passwordForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In with Password
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="otp" className="space-y-4">
            <form onSubmit={otpForm.handleSubmit(onOTPSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact-otp">Email or Mobile</Label>
                <Input
                  id="contact-otp"
                  placeholder="your@email.com or 9876543210"
                  {...otpForm.register('contact')}
                  disabled={isPending}
                />
                {otpForm.formState.errors.contact && (
                  <p className="text-sm text-red-600">
                    {otpForm.formState.errors.contact.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp">OTP</Label>
                <Input
                  id="otp"
                  placeholder="Enter 4-6 digit OTP"
                  {...otpForm.register('otp')}
                  disabled={isPending}
                />
                {otpForm.formState.errors.otp && (
                  <p className="text-sm text-red-600">
                    {otpForm.formState.errors.otp.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In with OTP
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="mt-4 text-center">
          <Button variant="link" className="text-sm">
            Forgot your password?
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};