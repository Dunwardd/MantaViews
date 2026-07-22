import { AppButton } from '@/components/ui/app-button';

type AuthButtonProps = {
  disabled?: boolean;
  label: string;
  loading?: boolean;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
};

export function AuthButton({
  disabled,
  label,
  loading,
  onPress,
  variant = 'primary',
}: AuthButtonProps) {
  return (
    <AppButton
      disabled={disabled}
      label={label}
      loading={loading}
      onPress={onPress}
      variant={variant}
    />
  );
}
