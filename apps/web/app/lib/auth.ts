import jwtDecode from "jwt-decode";

type User = {
  id: string;
  email: string;
  name?: string;
};

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    return jwtDecode<User>(token);
  } catch {
    return null;
  }
}
