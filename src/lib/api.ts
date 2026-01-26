/**
 * API Client para comunicarse con el backend FastAPI
 *
 * Configurado para funcionar con:
 * - Desarrollo local: http://localhost:8000
 * - Produccion: URL configurada en NEXT_PUBLIC_API_URL
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Returns the API URL for use in components
 */
export function getApiUrl(): string {
  return API_URL;
}

// Token JWT guardado en memoria (se pierde al refrescar)
let authToken: string | null = null;

// Para persistencia entre recargas, usar localStorage
if (typeof window !== 'undefined') {
  authToken = localStorage.getItem('auth_token');
}

/**
 * Guarda el token de autenticacion
 */
export function setAuthToken(token: string | null) {
  authToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }
}

/**
 * Obtiene el token actual
 */
export function getAuthToken(): string | null {
  return authToken;
}

/**
 * Verifica si el usuario esta autenticado
 */
export function isAuthenticated(): boolean {
  return !!authToken;
}

/**
 * Hace una peticion al API con manejo de errores y autenticacion
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Agregar token de autenticacion si existe
  if (authToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Manejar errores HTTP
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Error desconocido' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// ============================================
// AUTH ENDPOINTS
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  profile_picture?: string;
  is_admin: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

/**
 * Autentica con Google OAuth
 * @param googleIdToken - Token ID de Google (credential from Google Sign-In)
 */
export async function loginWithGoogle(googleIdToken: string): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ id_token: googleIdToken }),
  });

  // Guardar el token automaticamente
  setAuthToken(response.access_token);

  return response;
}

/**
 * Obtiene el usuario actual
 */
export async function getCurrentUser(): Promise<User> {
  return apiRequest<User>('/auth/me');
}

/**
 * Cierra sesion
 */
export function logout() {
  setAuthToken(null);
}

/**
 * Request para actualizar perfil
 */
export interface UpdateProfileRequest {
  name?: string;
  profile_picture?: string;
}

/**
 * Actualiza el perfil del usuario actual
 */
export async function updateProfile(data: UpdateProfileRequest): Promise<User> {
  return apiRequest<User>('/auth/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ============================================
// EVENTS ENDPOINTS
// ============================================

export interface EventLocation {
  venue?: string;
  city?: string;
  country?: string;
}

export interface Event {
  id: number;
  name: string;
  date: string;
  status: string;
  location?: EventLocation;
  total_bouts: number;
  promotion: string;
  poster_image_url?: string;
}

export interface EventsResponse {
  events: Event[];
  total: number;
}

/**
 * Obtiene lista de eventos
 */
export async function getEvents(params?: {
  status?: string;
  limit?: number;
  skip?: number;
}): Promise<EventsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.skip) searchParams.set('skip', String(params.skip));

  const query = searchParams.toString();
  // Backend returns array directly, wrap it in the expected format
  const events = await apiRequest<Event[]>(`/events${query ? `?${query}` : ''}`);
  return { events, total: events.length };
}

/**
 * Obtiene un evento por ID
 */
export async function getEvent(eventId: number): Promise<Event> {
  return apiRequest<Event>(`/events/${eventId}`);
}

// ============================================
// BOUTS ENDPOINTS
// ============================================

export interface Fighter {
  fighter_name: string;
  corner: 'red' | 'blue';

  // Basic info
  nickname?: string;
  nationality?: string;
  fighting_out_of?: string;

  // Records
  record_at_fight?: {
    wins: number;
    losses: number;
    draws: number;
  };
  last_5_fights?: string[]; // ["W", "L", "W", "W", "W"]

  // Rankings
  ranking?: {
    position: number;
    division: string;
  };
  ufc_ranking?: {
    position: number;
    division: string;
  };

  // Betting & Title
  betting_odds?: {
    line: string;
    description: string;
  };
  title_status?: string; // "Champion" | "Challenger"

  // Physical stats
  age_at_fight_years?: number;
  age_at_fight?: {
    years: number;
    months: number;
    days: number;
  };
  height_cm?: number;
  height?: {
    feet: number;
    inches: number;
    cm: number;
  };
  reach_cm?: number;
  reach?: {
    inches: number;
    cm: number;
  };
  latest_weight?: {
    lbs: number;
    kgs: number;
  };

  // Training
  gym?: {
    primary: string;
    other: string[];
  };

  // Tapology data
  tapology_id?: string;
  tapology_url?: string;
  profile_image_url?: string;
}

/**
 * Helper to get fighter image URL from Tapology THROUGH NGINX PROXY
 * Returns placeholder if no tapology_id available
 */
export function getFighterImageUrl(
  fighter: Fighter,
  size: 'small' | 'medium' | 'large' = 'small'
): string {
  if (!fighter.tapology_id || fighter.tapology_id === 'null') {
    return '/placeholder-fighter.svg';
  }

  // El backend DEBE devolver la ruta correcta del headshot
  if (!fighter.profile_image_url) {
    return '/placeholder-fighter.svg';
  }

  return `${API_URL}${fighter.profile_image_url}`;
}
/**
 * Helper to get event poster URL through proxy
 */
export function getEventPosterUrl(event: Event): string {
  // Use the poster_image_url from the backend if available
  if (!event.poster_image_url) {
    return '/placeholder-event.svg';
  }
  return `${API_URL}${event.poster_image_url}`;
}

export interface Bout {
  id: number;
  event_id: number;
  weight_class: string;
  gender: string;
  rounds_scheduled: number;
  is_title_fight: boolean;
  status: string;
  fighters: {
    red: Fighter;
    blue: Fighter;
  };
  result?: {
    winner?: 'red' | 'blue' | null;
    method?: string;
    round?: number;
    time?: string;
  };
}

/**
 * Obtiene las peleas de un evento
 */
export async function getEventBouts(eventId: number): Promise<Bout[]> {
  return apiRequest<Bout[]>(`/events/${eventId}/bouts`);
}

// ============================================
// PICKS ENDPOINTS
// ============================================

export interface Pick {
  id: string;
  user_id: string;
  event_id: number;
  bout_id: number;
  picked_corner: 'red' | 'blue';
  picked_method: 'DEC' | 'KO/TKO' | 'SUB';
  picked_round?: number;
  is_correct?: boolean;
  points_awarded: number;
  locked: boolean;
  created_at: string;
}

export interface CreatePickRequest {
  event_id: number;
  bout_id: number;
  picked_corner: 'red' | 'blue';
  picked_method: 'DEC' | 'KO/TKO' | 'SUB';
  picked_round?: number;
}

/**
 * Crea o actualiza un pick
 */
export async function createPick(pick: CreatePickRequest): Promise<Pick> {
  return apiRequest<Pick>('/picks', {
    method: 'POST',
    body: JSON.stringify(pick),
  });
}

/**
 * Obtiene los picks del usuario actual para un evento
 * @param eventId - ID del evento (requerido)
 */
export async function getMyPicks(eventId: number): Promise<Pick[]> {
  return apiRequest<Pick[]>(`/picks/me?event_id=${eventId}`);
}

/**
 * Obtiene todos los picks del usuario actual (multiple eventos)
 */
export async function getAllMyPicks(): Promise<Pick[]> {
  return apiRequest<Pick[]>('/picks/me/all');
}

// ============================================
// LEADERBOARD ENDPOINTS
// ============================================

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  avatar_url?: string;
  total_points: number;
  picks_total: number;
  picks_correct: number;
  accuracy: number;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  user_position?: LeaderboardEntry;
}

/**
 * Obtiene el leaderboard global
 */
export async function getGlobalLeaderboard(params?: {
  year?: number;
  limit?: number;
}): Promise<LeaderboardResponse> {
  const searchParams = new URLSearchParams();
  if (params?.year) searchParams.set('year', String(params.year));
  if (params?.limit) searchParams.set('limit', String(params.limit));

  const query = searchParams.toString();
  return apiRequest<LeaderboardResponse>(`/leaderboard/global${query ? `?${query}` : ''}`);
}

/**
 * Obtiene el leaderboard de un evento específico
 */
export async function getEventLeaderboard(eventId: number, limit?: number): Promise<LeaderboardResponse> {
  const searchParams = new URLSearchParams();
  if (limit) searchParams.set('limit', String(limit));

  const query = searchParams.toString();
  return apiRequest<LeaderboardResponse>(`/leaderboard/event/${eventId}${query ? `?${query}` : ''}`);
}

/**
 * Obtiene el leaderboard por categoría
 */
export async function getCategoryLeaderboard(
  category: string,
  params?: {
    year?: number;
    limit?: number;
  }
): Promise<LeaderboardResponse> {
  const searchParams = new URLSearchParams();
  if (params?.year) searchParams.set('year', String(params.year));
  if (params?.limit) searchParams.set('limit', String(params.limit));

  const query = searchParams.toString();
  return apiRequest<LeaderboardResponse>(`/leaderboard/category/${category}${query ? `?${query}` : ''}`);
}

/**
 * Obtiene la posición del usuario actual en el leaderboard
 */
export async function getMyLeaderboardPosition(category: string = 'global'): Promise<{
  rank: number | null;
  entry: LeaderboardEntry | null;
}> {
  const searchParams = new URLSearchParams();
  searchParams.set('category', category);
  
  return apiRequest<{ rank: number | null; entry: LeaderboardEntry | null }>(
    `/leaderboard/me?${searchParams.toString()}`
  );
}

// ============================================
// HEALTH CHECK
// ============================================

export interface HealthStatus {
  status: string;
  database: string;
  version: string;
}

/**
 * Verifica el estado del backend
 */
export async function checkHealth(): Promise<HealthStatus> {
  return apiRequest<HealthStatus>('/health');
}

// Export default object with all functions
const api = {
  // Auth
  loginWithGoogle,
  getCurrentUser,
  logout,
  updateProfile,
  setAuthToken,
  getAuthToken,
  isAuthenticated,

  // Events
  getEvents,
  getEvent,

  // Bouts
  getEventBouts,

  // Picks
  createPick,
  getMyPicks,
  getAllMyPicks,

  // Leaderboard
  getGlobalLeaderboard,
  getEventLeaderboard,
  getCategoryLeaderboard,
  getMyLeaderboardPosition,

  // Health
  checkHealth,
};

export default api;
