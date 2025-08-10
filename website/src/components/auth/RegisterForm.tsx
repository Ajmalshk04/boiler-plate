import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { useRegister } from '../../hooks/useAuth';
import { Loader2 } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  mobile: z.string().regex(/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  accountType: z.enum(['Individual', 'Corporate']),
  companyName: z.string().optional(),
  gstinNo: z.string().optional(),
  getWhatsappUpdate: z.boolean().default(false),
  acceptTermsAndConditions: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine((data) => {
  if (data.accountType === 'Corporate' && !data.companyName) {
    return false;
  }
  return true;
}, {
  message: 'Company name is required for corporate accounts',
  path: ['companyName'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const { mutate: register, isPending } = useRegister();
  const [accountType, setAccountType] = useState<'Individual' | 'Corporate'>('Individual');

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      accountType: 'Individual',
      getWhatsappUpdate: false,
      acceptTermsAndConditions: false,
    },
  });

  const watchedAccountType = watch('accountType');

  const onSubmit = (data: RegisterFormData) => {
    register(data, {
      onSuccess: () => {
        onSuccess?.();
      },
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>
          Sign up to get started with our platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Enter your full name"
              {...formRegister('name')}
              disabled={isPending}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              {...formRegister('email')}
              disabled={isPending}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobile">Mobile Number</Label>
            <Input
              id="mobile"
              placeholder="9876543210"
              {...formRegister('mobile')}
              disabled={isPending}
            />
            {errors.mobile && (
              <p className="text-sm text-red-600">{errors.mobile.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a strong password"
              {...formRegister('password')}
              disabled={isPending}
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountType">Account Type</Label>
            <Select
              value={watchedAccountType}
              onValueChange={(value: 'Individual' | 'Corporate') => {
                setValue('accountType', value);
                setAccountType(value);
              }}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Individual">Individual</SelectItem>
                <SelectItem value="Corporate">Corporate</SelectItem>
              </SelectContent>
            </Select>
            {errors.accountType && (
              <p className="text-sm text-red-600">{errors.accountType.message}</p>
            )}
          </div>

          {watchedAccountType === 'Corporate' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  placeholder="Enter company name"
                  {...formRegister('companyName')}
                  disabled={isPending}
                />
                {errors.companyName && (
                  <p className="text-sm text-red-600">{errors.companyName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gstinNo">GSTIN Number (Optional)</Label>
                <Input
                  id="gstinNo"
                  placeholder="22AAAAA0000A1Z5"
                  {...formRegister('gstinNo')}
                  disabled={isPending}
                />
                {errors.gstinNo && (
                  <p className="text-sm text-red-600">{errors.gstinNo.message}</p>
                )}
              </div>
            </>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="getWhatsappUpdate"
              {...formRegister('getWhatsappUpdate')}
              disabled={isPending}
            />
            <Label htmlFor="getWhatsappUpdate" className="text-sm">
              I want to receive WhatsApp updates
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="acceptTermsAndConditions"
              {...formRegister('acceptTermsAndConditions')}
              disabled={isPending}
            />
            <Label htmlFor="acceptTermsAndConditions" className="text-sm">
              I accept the terms and conditions
            </Label>
          </div>
          {errors.acceptTermsAndConditions && (
            <p className="text-sm text-red-600">{errors.acceptTermsAndConditions.message}</p>
          )}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};