export interface Project {
  id: string
  name: string
  description?: string | null
  repo_url?: string | null
  repo_full_name?: string | null
  deploy_url?: string | null
  created_at: string
}

export interface ProjectInput {
  repo_url: string
  deploy_url: string
  name?: string
  description?: string
}

export interface Me {
  sub: string
  email: string | null
  github_connected: boolean
}
