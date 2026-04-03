export const api = async (url: string, body: any) => {
  return fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
};

export const registerUser = (data: any) =>
  api("/api/auth/register/", data);

export const verifyEmail = (email: string, code: string) =>
  api("/api/auth/verify-email/", { email, code });

export const requestPasswordReset = (email: string) =>
  api("/api/auth/password-reset-request/", { email });

export const confirmPasswordReset = (
  email: string,
  code: string,
  newPassword: string
) =>
  api("/api/auth/password-reset-confirm/", {
    email,
    code,
    new_password: newPassword,
  });