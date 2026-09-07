// Hooks de React Query sobre la capa de api: carga, errores y cache.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { type CreatePickRequest } from './api';

// ============================================
// AUTH HOOKS
// ============================================

export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: api.getCurrentUser,
    enabled: api.isAuthenticated(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// Flujo antiguo con id_token; el nuevo botón usa useGoogleAccessTokenLogin.
export function useGoogleLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (googleToken: string) => api.loginWithGoogle(googleToken),
    onSuccess: () => {
      // Refrescar el usuario actual despues de login
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

export function useGoogleAccessTokenLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accessToken: string) => api.loginWithGoogleAccessToken(accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return () => {
    api.logout();
    queryClient.clear(); // Limpiar todo el cache
  };
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name?: string; profile_picture?: string }) =>
      api.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

// ============================================
// EVENTS HOOKS
// ============================================

export function useEvents(params?: { status?: string; limit?: number }) {
  return useQuery({
    queryKey: ['events', params],
    queryFn: () => api.getEvents(params),
    staleTime: 60 * 1000, // 1 minuto
  });
}

export function useEvent(eventId: number) {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: () => api.getEvent(eventId),
    enabled: !!eventId,
    staleTime: 60 * 1000,
  });
}

// ============================================
// BOUTS HOOKS
// ============================================

export function useEventBouts(eventId: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['bouts', eventId],
    queryFn: () => api.getEventBouts(eventId),
    enabled: options?.enabled !== undefined ? options.enabled && !!eventId : !!eventId,
    staleTime: 60 * 1000,
  });
}

// ============================================
// PICKS HOOKS
// ============================================

export function useMyPicks(eventId: number) {
  return useQuery({
    queryKey: ['myPicks', eventId],
    queryFn: () => api.getMyPicks(eventId),
    enabled: api.isAuthenticated() && !!eventId,
    staleTime: 30 * 1000, // 30 segundos
  });
}

export function useAllMyPicks() {
  return useQuery({
    queryKey: ['allMyPicks'],
    queryFn: () => api.getAllMyPicks(),
    enabled: api.isAuthenticated(),
    staleTime: 30 * 1000,
  });
}

export function useAllMyPicksDetailed() {
  return useQuery({
    queryKey: ['allMyPicksDetailed'],
    queryFn: () => api.getAllMyPicksDetailed(),
    enabled: api.isAuthenticated(),
    staleTime: 30 * 1000,
  });
}

export function useMyPicksWithBouts(eventId: number) {
  const { data: picks, ...picksQuery } = useMyPicks(eventId);
  const { data: bouts, ...boutsQuery } = useEventBouts(eventId);

  return {
    ...picksQuery,
    ...boutsQuery,
    isLoading: picksQuery.isLoading || boutsQuery.isLoading,
    data: picks && bouts ? picks.map(pick => {
      const bout = bouts.find(b => b.id === pick.bout_id);
      return { pick, bout };
    }).filter(item => item.bout !== undefined) : undefined,
  };
}

export function useCreatePick() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pick: CreatePickRequest) => api.createPick(pick),
    onSuccess: () => {
      // Invalidar los picks para que se recarguen
      queryClient.invalidateQueries({ queryKey: ['myPicks'] });
    },
  });
}

// ============================================
// LEADERBOARD HOOKS
// ============================================

export function useGlobalLeaderboard(params?: { year?: number; limit?: number }) {
  return useQuery({
    queryKey: ['leaderboard', 'global', params],
    queryFn: async () => {
      const response = await api.getGlobalLeaderboard(params);
      return response.entries;
    },
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}

export function useEventLeaderboard(eventId: number, limit?: number) {
  return useQuery({
    queryKey: ['leaderboard', 'event', eventId, limit],
    queryFn: async () => {
      const response = await api.getEventLeaderboard(eventId, limit);
      return response.entries;
    },
    enabled: !!eventId,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}

export function useCategoryLeaderboard(category: string, params?: { year?: number; limit?: number }) {
  return useQuery({
    queryKey: ['leaderboard', 'category', category, params],
    queryFn: async () => {
      const response = await api.getCategoryLeaderboard(category, params);
      return response.entries;
    },
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}

export function useMyLeaderboardPosition(category: string = 'global') {
  return useQuery({
    queryKey: ['leaderboard', 'me', category],
    queryFn: () => api.getMyLeaderboardPosition(category),
    enabled: api.isAuthenticated(),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}

// ============================================
// HEALTH HOOKS
// ============================================

export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: api.checkHealth,
    refetchInterval: 30 * 1000, // Cada 30 segundos
    retry: 1,
  });
}

// ============================================
// PUBLIC USER PROFILE HOOKS
// ============================================

export function useUserProfile(userId: string) {
  return useQuery({
    queryKey: ['userProfile', userId],
    queryFn: () => api.getUserProfile(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useUserPicks(userId: string, params?: {
  event_id?: number;
  year?: number;
  status?: 'correct' | 'incorrect' | 'pending';
  limit?: number;
  skip?: number;
}) {
  return useQuery({
    queryKey: ['userPicks', userId, params],
    queryFn: () => api.getUserPicks(userId, params),
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}

/**
 * Another user's mission standing for the profile card.
 *
 * `retry: false` because the two realistic failures, the missions feature is
 * dark for this viewer, or the user has no record, both answer 404, and
 * retrying a 404 only delays the card.
 */
export function useUserMissionProfile(userId: string | null) {
  return useQuery({
    queryKey: ['userMissionProfile', userId],
    queryFn: () => api.getUserMissionProfile(userId as string),
    enabled: api.isAuthenticated() && !!userId,
    retry: false,
    staleTime: 60 * 1000,
  });
}

export function useUserPicksStats(userId: string, year?: number) {
  return useQuery({
    queryKey: ['userPicksStats', userId, year],
    queryFn: () => api.getUserPicksStats(userId, year),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}
