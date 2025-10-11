import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/hooks/useUser';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User, Mail, Phone, Camera, Check, AlertCircle, Loader2, Building, Briefcase, Globe, MapPin, Calendar } from 'lucide-react';


// ============================================
// VALIDATION SCHEMA - Complete Profile
// ============================================

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number').optional().or(z.literal('')),
  company: z.string().max(100).optional().or(z.literal('')),
  jobTitle: z.string().max(100).optional().or(z.literal('')),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  bio: z.string().max(500).optional().or(z.literal('')),
  location: z.string().max(100).optional().or(z.literal('')),
  timezone: z.string().optional(),
  addressLine1: z.string().max(200).optional().or(z.literal('')),
  addressLine2: z.string().max(200).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  state: z.string().max(100).optional().or(z.literal('')),
  zipCode: z.string().max(20).optional().or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const timezones = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'UTC', label: 'UTC' },
];

export default function Profile() {
  const { user, isLoading: userLoading, updateProfile } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      phone: '',
      company: '',
      jobTitle: '',
      website: '',
      bio: '',
      location: '',
      timezone: 'America/New_York',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US',
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        phone: user.phone || '',
        company: (user as any).company || '',
        jobTitle: (user as any).jobTitle || '',
        website: (user as any).website || '',
        bio: (user as any).bio || '',
        location: (user as any).location || '',
        timezone: (user as any).timezone || 'America/New_York',
        addressLine1: (user as any).addressLine1 || '',
        addressLine2: (user as any).addressLine2 || '',
        city: (user as any).city || '',
        state: (user as any).state || '',
        zipCode: (user as any).zipCode || '',
        country: (user as any).country || 'US',
      });
      setAvatarPreview(user.avatar);
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await updateProfile(data as any);
      setSuccess('Profile updated successfully');
      setIsEditing(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      reset({
        name: user.name || '',
        phone: user.phone || '',
        company: (user as any).company || '',
        jobTitle: (user as any).jobTitle || '',
        website: (user as any).website || '',
        bio: (user as any).bio || '',
        location: (user as any).location || '',
        timezone: (user as any).timezone || 'America/New_York',
        addressLine1: (user as any).addressLine1 || '',
        addressLine2: (user as any).addressLine2 || '',
        city: (user as any).city || '',
        state: (user as any).state || '',
        zipCode: (user as any).zipCode || '',
        country: (user as any).country || 'US',
      });
    }
    setIsEditing(false);
    setError(null);
  };

const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    setError('Image must be less than 5MB');
    return;
  }

  if (!file.type.startsWith('image/')) {
    setError('Please upload an image file');
    return;
  }

  // Create preview
  const reader = new FileReader();
  reader.onloadend = () => {
    setAvatarPreview(reader.result as string);
  };
  reader.readAsDataURL(file);

  try {
    setIsSaving(true);
    setError(null);
    
    // Upload avatar
    const avatarUrl = await userService.uploadAvatar(file);
    
    // Update local state
    setSuccess('Profile photo updated successfully');
    setTimeout(() => setSuccess(null), 3000);
    
    // Refresh profile to get updated data
    await fetchProfile();
  } catch (err: any) {
    setError(err.response?.data?.error?.message || 'Failed to upload photo');
    setAvatarPreview(user?.avatar || null);
  } finally {
    setIsSaving(false);
  }
};

  if (userLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your personal information and preferences
        </p>
      </div>

      {/* Success Message */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3"
          >
            <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
            <p className="text-sm text-green-800 dark:text-green-300">{success}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
{/* Avatar Section */}
<div className="bg-card border border-border rounded-xl p-6">
  <h2 className="text-lg font-semibold mb-4">Profile Photo</h2>
  <div className="flex items-center gap-6">
    <div className="relative group">
      <div className="w-24 h-24 rounded-full overflow-hidden bg-secondary flex items-center justify-center">
        {avatarPreview ? (
          <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <User className="w-12 h-12 text-muted-foreground" />
        )}
      </div>
      <label
        htmlFor="avatar-upload"
        className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center"
      >
        <Camera className="w-6 h-6 text-white" />
      </label>
      <input
        id="avatar-upload"
        type="file"
        accept="image/*"
        onChange={handleAvatarChange}
        className="hidden"
      />
    </div>
    <div>
      <h3 className="font-medium mb-1">{user.name || 'No name set'}</h3>
      <p className="text-sm text-muted-foreground mb-3">{user.email}</p>
      <label htmlFor="avatar-upload" className="cursor-pointer">
        <Button variant="outline" size="sm" type="button">
          <Camera className="w-4 h-4 mr-2" />
          Change photo
        </Button>
      </label>
    </div>
  </div>
</div>
        {/* Basic Information */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-6">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email (Read-only) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Email address</label>
              <Input value={user.email} disabled icon={<Mail className="w-5 h-5" />} className="bg-muted/50" />
              <p className="mt-1.5 text-xs text-muted-foreground">
                Email cannot be changed. Contact support if needed.
              </p>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Full name <span className="text-red-500">*</span>
              </label>
              <Input
                {...register('name')}
                id="name"
                placeholder="John Doe"
                disabled={!isEditing}
                error={errors.name?.message}
                icon={<User className="w-5 h-5" />}
                className={!isEditing ? 'bg-muted/50' : ''}
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-2">Phone number</label>
              <Input
                {...register('phone')}
                id="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                disabled={!isEditing}
                error={errors.phone?.message}
                icon={<Phone className="w-5 h-5" />}
                className={!isEditing ? 'bg-muted/50' : ''}
              />
            </div>

            {/* Company */}
            <div>
              <label htmlFor="company" className="block text-sm font-medium mb-2">Company</label>
              <Input
                {...register('company')}
                id="company"
                placeholder="Acme Inc."
                disabled={!isEditing}
                error={errors.company?.message}
                icon={<Building className="w-5 h-5" />}
                className={!isEditing ? 'bg-muted/50' : ''}
              />
            </div>

            {/* Job Title */}
            <div>
              <label htmlFor="jobTitle" className="block text-sm font-medium mb-2">Job Title</label>
              <Input
                {...register('jobTitle')}
                id="jobTitle"
                placeholder="Software Engineer"
                disabled={!isEditing}
                error={errors.jobTitle?.message}
                icon={<Briefcase className="w-5 h-5" />}
                className={!isEditing ? 'bg-muted/50' : ''}
              />
            </div>

            {/* Website */}
            <div className="md:col-span-2">
              <label htmlFor="website" className="block text-sm font-medium mb-2">Website</label>
              <Input
                {...register('website')}
                id="website"
                type="url"
                placeholder="https://example.com"
                disabled={!isEditing}
                error={errors.website?.message}
                icon={<Globe className="w-5 h-5" />}
                className={!isEditing ? 'bg-muted/50' : ''}
              />
            </div>

            {/* Bio */}
            <div className="md:col-span-2">
              <label htmlFor="bio" className="block text-sm font-medium mb-2">Bio</label>
              <textarea
                {...register('bio')}
                id="bio"
                rows={4}
                placeholder="Tell us about yourself..."
                disabled={!isEditing}
                className={`w-full px-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none ${
                  !isEditing ? 'bg-muted/50' : ''
                }`}
              />
              {errors.bio && <p className="mt-1 text-xs text-red-500">{errors.bio.message}</p>}
            </div>
          </div>
        </div>

        {/* Location & Timezone */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-6">Location & Timezone</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium mb-2">Location</label>
              <Input
                {...register('location')}
                id="location"
                placeholder="San Francisco, CA"
                disabled={!isEditing}
                error={errors.location?.message}
                icon={<MapPin className="w-5 h-5" />}
                className={!isEditing ? 'bg-muted/50' : ''}
              />
            </div>

            {/* Timezone */}
            <div>
              <label htmlFor="timezone" className="block text-sm font-medium mb-2">Timezone</label>
              <select
                {...register('timezone')}
                id="timezone"
                disabled={!isEditing}
                className={`w-full px-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                  !isEditing ? 'bg-muted/50' : ''
                }`}
              >
                {timezones.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-6">Address</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Address Line 1 */}
            <div className="md:col-span-2">
              <label htmlFor="addressLine1" className="block text-sm font-medium mb-2">Address Line 1</label>
              <Input
                {...register('addressLine1')}
                id="addressLine1"
                placeholder="123 Main Street"
                disabled={!isEditing}
                error={errors.addressLine1?.message}
                className={!isEditing ? 'bg-muted/50' : ''}
              />
            </div>

            {/* Address Line 2 */}
            <div className="md:col-span-2">
              <label htmlFor="addressLine2" className="block text-sm font-medium mb-2">Address Line 2</label>
              <Input
                {...register('addressLine2')}
                id="addressLine2"
                placeholder="Apt 4B"
                disabled={!isEditing}
                error={errors.addressLine2?.message}
                className={!isEditing ? 'bg-muted/50' : ''}
              />
            </div>

            {/* City */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium mb-2">City</label>
              <Input
                {...register('city')}
                id="city"
                placeholder="San Francisco"
                disabled={!isEditing}
                error={errors.city?.message}
                className={!isEditing ? 'bg-muted/50' : ''}
              />
            </div>

            {/* State */}
            <div>
              <label htmlFor="state" className="block text-sm font-medium mb-2">State/Province</label>
              <Input
                {...register('state')}
                id="state"
                placeholder="CA"
                disabled={!isEditing}
                error={errors.state?.message}
                className={!isEditing ? 'bg-muted/50' : ''}
              />
            </div>

            {/* Zip Code */}
            <div>
              <label htmlFor="zipCode" className="block text-sm font-medium mb-2">ZIP/Postal Code</label>
              <Input
                {...register('zipCode')}
                id="zipCode"
                placeholder="94102"
                disabled={!isEditing}
                error={errors.zipCode?.message}
                className={!isEditing ? 'bg-muted/50' : ''}
              />
            </div>

            {/* Country */}
            <div>
              <label htmlFor="country" className="block text-sm font-medium mb-2">Country</label>
              <Input
                {...register('country')}
                id="country"
                placeholder="US"
                disabled={!isEditing}
                error={errors.country?.message}
                className={!isEditing ? 'bg-muted/50' : ''}
              />
            </div>
          </div>
        </div>

        {/* Account Status */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Account Status</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">Email Verified</span>
              {user.emailVerified ? (
                <span className="text-sm font-medium text-green-600">✓ Verified</span>
              ) : (
                <span className="text-sm font-medium text-yellow-600">⚠ Not Verified</span>
              )}
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">Two-Factor Auth</span>
              {user.twoFactorEnabled ? (
                <span className="text-sm font-medium text-green-600">✓ Enabled</span>
              ) : (
                <span className="text-sm font-medium text-muted-foreground">Disabled</span>
              )}
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">Member Since</span>
              <span className="text-sm font-medium">
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div>
            {isEditing && isDirty && (
              <p className="text-sm text-muted-foreground">You have unsaved changes</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <Button type="button" variant="ghost" onClick={handleCancel} disabled={isSaving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving || !isDirty} isLoading={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            ) : (
              <Button type="button" onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}