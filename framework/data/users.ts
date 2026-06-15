import type { User } from '@types';

export const standardUser: User = {
  username: 'standard_user',
  password: 'secret_sauce',
};

export const lockedOutUser: User = {
  username: 'locked_out_user',
  password: standardUser.password,
};

export const emptyUsernameUser: User = {
  username: '',
  password: standardUser.password,
};

export const emptyPasswordUser: User = {
  username: standardUser.username,
  password: '',
};

export const emptyCredentialsUser: User = {
  username: '',
  password: '',
};

export const invalidUsernameUser: User = {
  username: 'invalid_user',
  password: standardUser.password,
};

export const invalidPasswordUser: User = {
  username: standardUser.username,
  password: 'wrong_password',
};

export const invalidCredentialsUser: User = {
  username: 'bogus',
  password: 'bogus_pw',
};

export const longCredentialsUser: User = {
  username: 'a'.repeat(5000),
  password: 'a'.repeat(5000),
};

export const specialCharacterUser: User = {
  username: `special!#$%^&*()_+[];'/{}|:"<>?`,
  password: `special!#$%^&*()_+[];'/{}|:"<>?`,
};

export const sqlInjectionUser: User = {
  username: "' OR '1'='1'; --",
  password: "' OR '1'='1'; --",
};

export const whitespaceCredentialsUser: User = {
  username: ` ${standardUser.username} `,
  password: ` ${standardUser.password} `,
};

export const caseVariantUser: User = {
  username: 'STANDARD_user',
  password: 'SECRET_SAUCE',
};
