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
    const detail = error.detail;
    const message = typeof detail === 'string' ? detail : JSON.stringify(detail) || `HTTP ${response.status}`;
    throw new Error(message);
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
 * Autentica con Google OAuth usando access_token (custom button flow)
 * @param accessToken - Access token de Google
 */
export async function loginWithGoogleAccessToken(accessToken: string): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ access_token: accessToken }),
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
  subtitle?: string;
  date: string;
  start_time_et?: string;  // Hora en ET (ej: "17:00")
  timezone?: string;  // Zona horaria (ej: "ET")
  status: string;
  location?: EventLocation;
  total_bouts: number;
  promotion: string;
  poster_image_url?: string;
  hero_image_url?: string;
  event_art_url?: string;
  picks_locked?: boolean;
  is_title_fight?: boolean;  // True si la pelea principal es por título
  is_bmf_title_fight?: boolean;  // True si la pelea principal es por el cinturón BMF
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

/**
 * Marca un evento como completado (solo admins)
 */
export async function completeEvent(eventId: number): Promise<void> {
  await apiRequest<{ success: boolean }>(`/admin/events/${eventId}/complete`, {
    method: 'POST',
  });
}

/**
 * Construye un Date object para un evento con su hora ET
 *
 * Convierte ET a UTC correctamente: ET = UTC-5, entonces UTC = ET + 5 horas
 * Esto permite que el countdown timer funcione correctamente sin problemas de timezone.
 *
 * @param event - Evento con date y start_time_et
 * @returns Date object en UTC con la hora correcta del evento
 */
export function getEventDateTime(event: Event): Date {
  const [year, month, day] = event.date.split('-').map(Number);

  if (!event.start_time_et) {
    // Si no hay hora específica, usar final del día UTC
    return new Date(Date.UTC(year, month - 1, day, 23, 59, 59));
  }

  // Parsear hora ET y convertir a UTC
  const [hours, minutes] = event.start_time_et.split(':').map(Number);
  // ET es UTC-5, entonces para convertir a UTC: UTC_hour = ET_hour + 5
  return new Date(Date.UTC(year, month - 1, day, hours + 5, minutes, 0));
}

// ============================================
// BOUTS ENDPOINTS
// ============================================

export interface Fighter {
  fighter_name: string;
  name?: string;
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

  // ESPN enrichment
  espn_id?: string;
  espn_url?: string;
  espn_headshot_url?: string;
  date_of_birth?: string;
  stance?: string;
  weight_class?: string;
  career_stats?: {
    wins_by_ko_tko?: number;
    losses_by_ko_tko?: number;
    wins_by_submission?: number;
    losses_by_submission?: number;
    title_wins?: number;
    title_losses?: number;
  };
  image_source?: string;

  // Tapology data
  tapology_id?: string;
  tapology_url?: string;
  profile_image_url?: string;
}

export function getFighterDisplayName(fighter?: Partial<Fighter> | null): string {
  const rawName =
    (typeof fighter?.fighter_name === 'string' && fighter.fighter_name) ||
    (typeof fighter?.name === 'string' && fighter.name) ||
    '';

  const normalizedName = rawName.trim();
  return normalizedName || 'TBD';
}

export function getNormalizedFighterName(fighter?: Partial<Fighter> | null): string {
  return getFighterDisplayName(fighter).toLowerCase().trim();
}

export function normalizeWeightClassLabel(value?: string | null): string {
  let words = String(value || 'Unknown')
    .trim()
    .split(/\s+/)
    .filter((word) => !['bout', 'match'].includes(word.toLowerCase().replace(/[.:-]/g, '')));

  if (words.length > 0 && words.length % 2 === 0) {
    const midpoint = words.length / 2;
    const left = words.slice(0, midpoint).join(' ').toLowerCase();
    const right = words.slice(midpoint).join(' ').toLowerCase();
    if (left === right) words = words.slice(0, midpoint);
  }
  return words.join(' ') || 'Unknown';
}

export function getFighterShortName(fighter?: Partial<Fighter> | null): string {
  const name = getFighterDisplayName(fighter);
  const nameParts = name.split(/\s+/).filter(Boolean);
  return (nameParts[nameParts.length - 1] || name).toUpperCase();
}

/**
 * Helper to get fighter image URL from Tapology THROUGH NGINX PROXY
 * Returns placeholder if no tapology_id available
 */
export function getFighterImageUrl(
  fighter: Fighter,
  size: 'small' | 'medium' | 'large' = 'small'
): string {
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

// Orden de extensiones a probar cuando la imagen original no existe.
// El backend a veces guarda image_key con la extensión equivocada
// (ej: guarda .jpg pero en S3 el archivo es .png), lo que produce un
// 403/404 de CloudFront. Probamos variantes hasta encontrar una que cargue.
const FIGHTER_IMAGE_EXT_PRIORITY = ['png', 'jpg', 'jpeg', 'webp', 'avif', 'gif'] as const;

export const FIGHTER_PLACEHOLDER = '/placeholder-fighter.svg';

/**
 * Devuelve la lista ordenada de URLs candidatas para la foto de un peleador.
 *
 * Sólo hace el "cascadeo" de extensiones para nuestras propias imágenes de
 * CloudFront/S3 (las que terminan en una extensión de imagen conocida).
 * Para URLs externas (avatares de Google) o proxys con query string, devuelve
 * la URL tal cual seguida del placeholder.
 *
 * La última entrada siempre es el placeholder, así el consumidor sabe que
 * cuando llega ahí debe rendirse.
 */
export function getFighterImageCandidates(
  fighter: Fighter,
  size: 'small' | 'medium' | 'large' = 'small'
): string[] {
  const base = getFighterImageUrl(fighter, size);

  if (base === FIGHTER_PLACEHOLDER) {
    return [FIGHTER_PLACEHOLDER];
  }

  // ^(prefijo).(ext)(?query)$ -> sólo cascadeamos si reconocemos la extensión.
  const match = base.match(/^(.*)\.(png|jpe?g|webp|avif|gif)(\?.*)?$/i);
  if (!match) {
    return [base, FIGHTER_PLACEHOLDER];
  }

  const prefix = match[1];
  const originalExt = match[2].toLowerCase();
  const query = match[3] ?? '';

  // Probar la extensión original primero (suele ser la correcta y ya cacheada),
  // luego el resto en orden de probabilidad.
  const orderedExts = [
    originalExt,
    ...FIGHTER_IMAGE_EXT_PRIORITY.filter((ext) => ext !== originalExt),
  ];

  const seen = new Set<string>();
  const candidates: string[] = [];
  for (const ext of orderedExts) {
    const url = `${prefix}.${ext}${query}`;
    if (!seen.has(url)) {
      seen.add(url);
      candidates.push(url);
    }
  }
  candidates.push(FIGHTER_PLACEHOLDER);
  return candidates;
}
/**
 * Helper to get event poster URL
 * Uses the Wikipedia-credited original source when available.
 */
export function getEventPosterUrl(event: Event): string {
  // Use the poster_image_url from the backend if available
  if (!event.poster_image_url) {
    return '/placeholder-event.svg';
  }

  // Source-resolved posters are absolute URLs and are served remotely.
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
 * Resolve the wide, high-resolution art for landing/detail heroes.
 * The official UFC background_image_xl_2x URL is always preferred. The
 * vertical source poster is the migration fallback until UFC publishes art.
 */
export function getEventImageUrl(event: Event): string {
  if (event.hero_image_url) {
    if (event.hero_image_url.startsWith('https://') || event.hero_image_url.startsWith('http://')) {
      return event.hero_image_url;
    }
    return `${API_URL}${event.hero_image_url}`;
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
  is_bmf_title_fight?: boolean;
  is_main_event?: boolean;
  status: string;
  fighters: {
    red: Fighter;
    blue: Fighter;
  };
  result?: BoutResult;
  picks_locked?: boolean;
}

export type BoutResultOutcome = 'red' | 'blue' | 'draw' | 'nc';

export interface BoutResult {
  winner?: 'red' | 'blue' | null;
  outcome?: BoutResultOutcome | null;
  method?: string;
  round?: number;
  time?: string;
}

export function getBoutResultOutcome(result?: BoutResult | null): BoutResultOutcome | null {
  if (!result) return null;
  if (result.outcome) return result.outcome;
  if (result.winner === 'red' || result.winner === 'blue') return result.winner;
  if (result.method || result.round !== undefined || result.time) return 'draw';
  return null;
}

export function hasBoutResult(result?: BoutResult | null): boolean {
  return getBoutResultOutcome(result) !== null;
}

export function getBoutResultLabel(result?: BoutResult | null): string {
  switch (getBoutResultOutcome(result)) {
    case 'red':
      return 'RED WIN';
    case 'blue':
      return 'BLUE WIN';
    case 'draw':
      return 'DRAW';
    case 'nc':
      return 'NO CONTEST';
    default:
      return 'RESULT';
  }
}

export function getBoutResultHeadline(
  result: BoutResult | null | undefined,
  redFighterName: string,
  blueFighterName: string
): string {
  switch (getBoutResultOutcome(result)) {
    case 'red':
      return `${redFighterName} WIN`;
    case 'blue':
      return `${blueFighterName} WIN`;
    case 'draw':
      return 'DRAW';
    case 'nc':
      return 'NO CONTEST';
    default:
      return 'RESULT';
  }
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
  picked_fighter_name: string;
  picked_method: 'DEC' | 'KO/TKO' | 'SUB';
  picked_round?: number;
  is_correct?: boolean;
  points_awarded: number;
  locked: boolean;
  created_at: string;
}

export interface DetailedPick {
  id: string;
  bout_id: number;
  event_id: number;
  event_name?: string;
  event_date?: string;
  picked_fighter_name: string;
  picked_method: 'DEC' | 'KO/TKO' | 'SUB';
  picked_round?: number;
  is_correct?: boolean;
  points_awarded: number;
  locked: boolean;
  created_at: string;
  fighter_red?: string;
  fighter_blue?: string;
  weight_class?: string;
  result?: BoutResult;
}

export interface CreatePickRequest {
  event_id: number;
  bout_id: number;
  picked_fighter_name: string;
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

/**
 * Obtiene todos los picks del usuario actual con detalles completos (fighters, event info, etc.)
 */
export async function getAllMyPicksDetailed(): Promise<DetailedPick[]> {
  return apiRequest<DetailedPick[]>('/picks/me/detailed');
}

/**
 * Limpia picks pendientes en eventos completados (peleas canceladas sin resultado)
 */
export async function cleanupPendingPicks(): Promise<{ deleted: number }> {
  return apiRequest<{ deleted: number }>('/picks/me/cleanup', { method: 'POST' });
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
  picked_fighter_name: string;
  picked_method: 'DEC' | 'KO/TKO' | 'SUB';
  picked_round?: number;
  is_correct?: boolean;
  points_awarded: number;
  locked: boolean;
  created_at: string;
  fighter_red?: string;
  fighter_blue?: string;
  weight_class?: string;
  result?: BoutResult;
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
  loginWithGoogleAccessToken,
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
  getAllMyPicksDetailed,
  cleanupPendingPicks,

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
