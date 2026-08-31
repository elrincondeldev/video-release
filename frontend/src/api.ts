import { fetchAuthSession } from "aws-amplify/auth";
import type { Me, Project, ProjectInput } from "./types";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 204) return undefined as T;
  const data = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const detail = (data as { detail?: string } | null)?.detail;
    throw new Error(detail ?? `HTTP ${res.status}`);
  }
  return data as T;
}

export const api = {
  me: () => request<Me>("/me"),
  listProjects: () => request<Project[]>("/projects"),
  createProject: (body: ProjectInput) =>
    request<Project>("/projects", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateProject: (id: string, body: ProjectInput) =>
    request<Project>(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  deleteProject: (id: string) =>
    request<void>(`/projects/${id}`, { method: "DELETE" }),
  linkGithub: (installationId: string) =>
    request<{ linked: boolean }>("/github/link", {
      method: "POST",
      body: JSON.stringify({ installation_id: installationId }),
    }),
};
