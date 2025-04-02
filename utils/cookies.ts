import Cookies from "js-cookie";

export const COOKIE_NAME = "keycloak_token";

export const setCookie = (token: string) => {
  Cookies.set(COOKIE_NAME, token, {
    expires: 7,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });
};

export const getCookie = (): string | undefined => {
  return Cookies.get(COOKIE_NAME);
};

export const removeCookie = () => {
  Cookies.remove(COOKIE_NAME, { path: "/" });
};
