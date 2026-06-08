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
  username: 'invalid_user',
  password: 'wrong_password',
};

export const veryLongCredentialsUser: User = {
  username: 'a'.repeat(5000),
  password: 'a'.repeat(5000),
};

export const specialCharacterCredentialsUser: User = {
  username: `special!#$%^&*()_+[];'/{}|:"<>?`,
  password: `special!#$%^&*()_+[];'/{}|:"<>?`,
};

export const sqlInjectionCredentialsUser: User = {
  username: "' OR '1'='1'; --",
  password: "' OR '1'='1'; --",
};

export const whitespaceCredentialsUser: User = {
  username: ` ${standardUser.username} `,
  password: ` ${standardUser.password} `,
};

export const alteredCaseCredentialsUser: User = {
  username: 'STANDARD_user',
  password: 'SECRET_SAUCE',
};

export const LOGIN_ERROR_MESSAGES = {
  usernameRequired: 'Epic sadface: Username is required',
  passwordRequired: 'Epic sadface: Password is required',
  invalidCredentials: 'Epic sadface: Username and password do not match any user in this service',
  lockedOut: 'Epic sadface: Sorry, this user has been locked out.',
  unauthorizedInventory:
    "Epic sadface: You can only access '/inventory.html' when you are logged in.",
} as const;
