/**
 * API Client para comunicarse con el backend FastAPI
 *
 * Configurado para funcionar con:
 * - Desarrollo local: http://localhost:8000
 * - Produccion: URL configurada en NEXT_PUBLIC_API_URL
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

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
  // User statistics
  total_points?: number;
  picks_total?: number;
  picks_correct?: number;
  perfect_picks?: number;
  accuracy?: number;
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
  event_art_url?: string;
  picks_locked?: boolean;
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
  console.log('[getFighterImageUrl]', {
    fighter_name: fighter.fighter_name,
    profile_image_url: fighter.profile_image_url,
    hasUrl: !!fighter.profile_image_url
  });
  
  // If no profile_image_url, show placeholder
  if (!fighter.profile_image_url) {
    return '/placeholder-fighter.svg';
  }

  // If it's an absolute URL (S3/CloudFront), use it directly
  if (fighter.profile_image_url.startsWith('https://') || fighter.profile_image_url.startsWith('http://')) {
    return fighter.profile_image_url;
  }

  // Otherwise it's a relative path - prepend API_URL
  // profile_image_url should be like: /proxy/tapology/letterboxd_images/33428/profile/thumb.jpg
  return `${API_URL}${fighter.profile_image_url}`;
}
/**
 * Helper to get event poster URL
 * Handles both CloudFront URLs (absolute) and proxy URLs (relative)
 */
export function getEventPosterUrl(event: Event): string {
  // Use the poster_image_url from the backend if available
  if (!event.poster_image_url) {
    return '/placeholder-event.svg';
  }

  // If it's an absolute URL (CloudFront), use it directly
  if (event.poster_image_url.startsWith('https://') || event.poster_image_url.startsWith('http://')) {
    return event.poster_image_url;
  }

  // Otherwise, it's a proxy URL - prepend API_URL
  return `${API_URL}${event.poster_image_url}`;
}

/**
 * Helper to get event art URL (admin-uploaded image stored in MongoDB)
 * Returns null if no event art, otherwise returns full API URL
 */
export function getEventArtUrl(event: Event): string | null {
  if (!event.event_art_url) {
    return null;
  }
  // event_art_url is always a relative path like /events/{id}/event-art
  return `${API_URL}${event.event_art_url}`;
}

/**
 * Helper to get the best image URL for an event
 * Prefers event_art (admin-uploaded) over poster (scraped from Tapology)
 */
export function getEventImageUrl(event: Event): string {
  const eventArt = getEventArtUrl(event);
  console.log('[getEventImageUrl]', { 
    eventId: event.id, 
    event_art_url: event.event_art_url, 
    poster_image_url: event.poster_image_url,
    eventArt, 
    willUsePoster: !eventArt 
  });
  
  // Test if event art actually exists by fetching it
  if (eventArt) {
    fetch(eventArt, { method: 'HEAD' })
      .then(response => {
        console.log('[getEventImageUrl] Event art HEAD check:', {
          url: eventArt,
          status: response.status,
          contentType: response.headers.get('content-type'),
          contentLength: response.headers.get('content-length')
        });
      })
      .catch(err => {
        console.error('[getEventImageUrl] Event art HEAD failed:', err);
      });
    return eventArt;
  }
  return getEventPosterUrl(event);
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
  picks_locked?: boolean;
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
  perfect_picks: number;
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

// ============================================
// ADMIN - PICKS LOCKS
// ============================================

export async function lockEventPicks(eventId: number): Promise<{ success: boolean; message: string }> {
  return apiRequest(`/admin/events/${eventId}/lock-picks`, {
    method: 'POST'
  });
}

export async function unlockEventPicks(eventId: number): Promise<{ success: boolean; message: string }> {
  return apiRequest(`/admin/events/${eventId}/unlock-picks`, {
    method: 'POST'
  });
}

export async function lockBoutPicks(boutId: number): Promise<{ success: boolean; message: string }> {
  return apiRequest(`/admin/bouts/${boutId}/lock-picks`, {
    method: 'POST'
  });
}

export async function unlockBoutPicks(boutId: number): Promise<{ success: boolean; message: string }> {
  return apiRequest(`/admin/bouts/${boutId}/unlock-picks`, {
    method: 'POST'
  });
}

// ============================================
// PUBLIC USER PROFILES
// ============================================

export interface PublicUserProfile {
  id: string;
  name: string;
  avatar_url?: string;
  created_at: string;
  total_points: number;
  picks_total: number;
  picks_correct: number;
  perfect_picks: number;
  accuracy: number;
}

export interface UserPick {
  id: string;
  bout_id: number;
  event_id: number;
  event_name?: string;
  event_date?: string;
  picked_corner: 'red' | 'blue';
  picked_method: 'DEC' | 'KO/TKO' | 'SUB';
  picked_round?: number;
  is_correct?: boolean;
  points_awarded: number;
  locked: boolean;
  created_at: string;
  fighter_red?: string;
  fighter_blue?: string;
  weight_class?: string;
  result?: {
    winner: 'red' | 'blue';
    method: string;
    round?: number;
    time?: string;
  };
}

export interface UserPicksStats {
  total_picks: number;
  correct_picks: number;
  incorrect_picks: number;
  pending_picks: number;
  total_points: number;
  perfect_picks: number;
  accuracy: number;
  by_method: {
    DEC: number;
    'KO/TKO': number;
    SUB: number;
  };
}

/**
 * Obtiene el perfil público de un usuario
 */
export async function getUserProfile(userId: string): Promise<PublicUserProfile> {
  return apiRequest<PublicUserProfile>(`/users/${userId}`);
}

/**
 * Obtiene los picks de un usuario (solo picks locked/públicos)
 */
export async function getUserPicks(userId: string, params?: {
  event_id?: number;
  year?: number;
  status?: 'correct' | 'incorrect' | 'pending';
  limit?: number;
  skip?: number;
}): Promise<UserPick[]> {
  const searchParams = new URLSearchParams();
  if (params?.event_id) searchParams.set('event_id', String(params.event_id));
  if (params?.year) searchParams.set('year', String(params.year));
  if (params?.status) searchParams.set('status', params.status);
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.skip) searchParams.set('skip', String(params.skip));

  const query = searchParams.toString();
  return apiRequest<UserPick[]>(`/users/${userId}/picks${query ? `?${query}` : ''}`);
}

/**
 * Obtiene las estadísticas de picks de un usuario
 */
export async function getUserPicksStats(userId: string, year?: number): Promise<UserPicksStats> {
  const searchParams = new URLSearchParams();
  if (year) searchParams.set('year', String(year));

  const query = searchParams.toString();
  return apiRequest<UserPicksStats>(`/users/${userId}/picks/stats${query ? `?${query}` : ''}`);
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

  // Admin - Picks Locks
  lockEventPicks,
  unlockEventPicks,
  lockBoutPicks,
  unlockBoutPicks,

  // Health
  checkHealth,

  // Public User Profiles
  getUserProfile,
  getUserPicks,
  getUserPicksStats,
};

export default api;
