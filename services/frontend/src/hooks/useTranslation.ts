import { useI18n } from '../contexts/i18nContext';

export function useTranslation() {
  const { translations } = useI18n();

  const t = (key: string, defaultValue: string | string[] = key): string | string[] => {
    const keys = key.split('.');
    let value: any = translations;

    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        return defaultValue;
      }
    }

    return typeof value === 'string' || Array.isArray(value) ? value : defaultValue;
  };

  const err = (message: string): string => {
    if (!message) return t('common.error') as string;

    const errorMap: Record<string, string> = {
      'Invalid credentials': 'auth.errors.invalidCredentials',
      'Email or Username already exists': 'auth.errors.userExists',
      'User not found': 'auth.errors.userNotFound',
      'Email already verified': 'auth.errors.emailAlreadyVerified',
      'Email verified succesfully': 'auth.errors.emailVerifiedSuccessfully',
      'Invalid token': 'auth.errors.invalidToken',
      'Link expired': 'auth.errors.linkExpired',
      'No valid 2FA code found or code expired': 'auth.errors.twoFaExpired',
      'Invalid 2FA code': 'auth.errors.invalidTwoFa',
      'Username already taken': 'auth.errors.usernameTaken',
      'Current password is incorrect': 'auth.errors.currentPasswordIncorrect',
      'Password updated successfully': 'auth.messages.passwordUpdated',
      'Friend added successfully': 'friends.friendAdded',
      'Friend removed successfully': 'friends.friendRemoved',
      'Invite not found': 'friends.errors.inviteNotFound',
      'Invite has already been used': 'friends.errors.inviteUsed',
      'Invite has expired': 'friends.errors.inviteExpired',
      'You cannot accept your own invite': 'friends.errors.cannotAcceptOwn',
      'Your user account was not found': 'friends.errors.userNotFound',
      'Invite sender no longer exists': 'friends.errors.senderNotFound',
      'You are already friends with this user': 'friends.errors.alreadyFriends',
      'You are not friends with this user': 'friends.errors.notFriends',
      'Image must be under 500KB': 'auth.errors.imageTooLarge',
      'request entity too large': 'auth.errors.imageTooLarge',
      'Request entity too large': 'auth.errors.imageTooLarge',
      'entity.too.large': 'auth.errors.imageTooLarge',
      'Failed to save': 'auth.errors.failedToSave',
      'Registration failed': 'auth.errors.registrationFailed',
      'Login failed': 'auth.errors.loginFailed',
      'No token received': 'auth.errors.noTokenReceived',
      '2FA verification failed': 'auth.errors.twoFaFailed',
      'Passwords match': 'auth.validation.passwordsMatch',
    };

    // Special case for the French error message found in identity
    if (message.includes('est déjà utilisé par un compte avec un email différent')) {
      return t('auth.errors.userExists') as string;
    }

    if (message.startsWith('User "') && message.endsWith('" not found')) {
      return t('friends.errors.friendUserNotFound') as string;
    }

    const key = errorMap[message];
    if (key) {
      return t(key) as string;
    }

    return message;
  };

  return { t, err };
}
