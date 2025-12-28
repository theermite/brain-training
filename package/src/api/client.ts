/**
 * API Client for Brain Training Backend
 * Handles communication with FastAPI backend for session management, scoring, and leaderboards
 * @author Jay "The Ermite" Goncalves
 * @copyright Jay The Ermite
 */

import {
  APIConfig,
  APIResponse,
  MemoryExerciseSession,
  MemoryExerciseSessionCreate,
  MemoryExerciseSessionUpdate,
  MemoryExerciseStats,
  MemoryExerciseLeaderboard,
  ConfigPreset,
  MemoryExerciseType,
} from '../types'

/**
 * Brain Training API Client
 * Provides methods to interact with the backend
 */
export class BrainTrainingAPIClient {
  private baseUrl: string
  private authToken?: string
  private onError?: (error: Error) => void

  constructor(config: APIConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '') // Remove trailing slash
    this.authToken = config.authToken
    this.onError = config.onError
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string) {
    this.authToken = token
  }

  /**
   * Generic fetch wrapper with error handling
   */
  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      }

      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return { data, success: true }
    } catch (error) {
      const err = error as Error
      if (this.onError) {
        this.onError(err)
      }
      return { data: null as any, success: false, error: err.message }
    }
  }

  // ============================================================================
  // MEMORY EXERCISE SESSION ENDPOINTS
  // ============================================================================

  /**
   * Create a new memory exercise session
   */
  async createSession(data: MemoryExerciseSessionCreate): Promise<APIResponse<MemoryExerciseSession>> {
    return this.fetch<MemoryExerciseSession>('/api/v1/memory-exercises/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Update an existing session with performance data
   */
  async updateSession(
    sessionId: number,
    data: MemoryExerciseSessionUpdate
  ): Promise<APIResponse<MemoryExerciseSession>> {
    return this.fetch<MemoryExerciseSession>(`/api/v1/memory-exercises/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: number): Promise<APIResponse<MemoryExerciseSession>> {
    return this.fetch<MemoryExerciseSession>(`/api/v1/memory-exercises/sessions/${sessionId}`)
  }

  /**
   * Get user's session history
   */
  async getSessionHistory(
    limit: number = 10,
    offset: number = 0
  ): Promise<APIResponse<MemoryExerciseSession[]>> {
    return this.fetch<MemoryExerciseSession[]>(
      `/api/v1/memory-exercises/sessions/me/history?limit=${limit}&offset=${offset}`
    )
  }

  /**
   * Get leaderboard for an exercise
   */
  async getLeaderboard(
    exerciseId: number,
    limit: number = 10
  ): Promise<APIResponse<MemoryExerciseLeaderboard[]>> {
    return this.fetch<MemoryExerciseLeaderboard[]>(
      `/api/v1/memory-exercises/leaderboard/${exerciseId}?limit=${limit}`
    )
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<APIResponse<MemoryExerciseStats[]>> {
    return this.fetch<MemoryExerciseStats[]>('/api/v1/memory-exercises/stats/me')
  }

  /**
   * Get configuration presets for an exercise type
   */
  async getConfigPresets(exerciseType: MemoryExerciseType): Promise<APIResponse<ConfigPreset[]>> {
    return this.fetch<ConfigPreset[]>(`/api/v1/memory-exercises/presets/${exerciseType}`)
  }

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  /**
   * Check if backend is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`)
      return response.ok
    } catch {
      return false
    }
  }
}

/**
 * Create a new API client instance
 */
export function createAPIClient(config: APIConfig): BrainTrainingAPIClient {
  return new BrainTrainingAPIClient(config)
}

/**
 * Default API client (can be configured globally)
 */
let defaultClient: BrainTrainingAPIClient | null = null

/**
 * Configure default API client
 */
export function configureDefaultClient(config: APIConfig) {
  defaultClient = createAPIClient(config)
}

/**
 * Get default API client (throws if not configured)
 */
export function getDefaultClient(): BrainTrainingAPIClient {
  if (!defaultClient) {
    throw new Error(
      'Default API client not configured. Call configureDefaultClient() before using exercises with backend.'
    )
  }
  return defaultClient
}
