import { http } from "./api";
import type { User } from "./types";

export async function fetchUserById(id: string): Promise<User> {
  const data = await http<{ success: boolean; user: User }>(`/api/users/${id}`);
  return data.user;
}
