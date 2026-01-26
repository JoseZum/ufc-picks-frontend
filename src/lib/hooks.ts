/**
 * React Hooks para usar la API con React Query
 *
 * Estos hooks manejan el estado de carga, errores y cache automaticamente.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, {
  type Event,
  type Bout,
  type Pick,
  type User,
  type CreatePickRequest,
  type LeaderboardEntry,
} from './api';

// ============================================
// AUTH HOOKS
// ============================================

/**
 * Hook para obtener el usuario actual
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: api.getCurrentUser,
    enabled: api.isAuthenticated(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para login con Google
 */
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

/**
 * Hook para logout
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return () => {
    api.logout();
    queryClient.clear(); // Limpiar todo el cache
  };
}

/**
 * Hook para actualizar perfil
 */
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

/**
 * Hook para obtener lista de eventos
 */
export function useEvents(params?: { status?: string; limit?: number }) {
  return useQuery({
    queryKey: ['events', params],
    queryFn: () => api.getEvents(params),
    staleTime: 60 * 1000, // 1 minuto
  });
}

/**
 * Hook para obtener un evento especifico
 */
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

/**
 * Hook para obtener las peleas de un evento
 */
export function useEventBouts(eventId: number) {
  return useQuery({
    queryKey: ['bouts', eventId],
    queryFn: () => api.getEventBouts(eventId),
    enabled: !!eventId,
    staleTime: 60 * 1000,
  });
}

// ============================================
// PICKS HOOKS
// ============================================

/**
 * Hook para obtener los picks del usuario para un evento
 */
export function useMyPicks(eventId: number) {
  return useQuery({
    queryKey: ['myPicks', eventId],
    queryFn: () => api.getMyPicks(eventId),
    enabled: api.isAuthenticated() && !!eventId,
    staleTime: 30 * 1000, // 30 segundos
  });
}

/**
 * Hook para obtener todos los picks del usuario
 */
export function useAllMyPicks() {
  return useQuery({
    queryKey: ['allMyPicks'],
    queryFn: () => api.getAllMyPicks(),
    enabled: api.isAuthenticated(),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook para obtener los picks del usuario con información completa de los bouts
 */
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

/**
 * Hook para crear un pick
 */
export function useCreatePick() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pick: CreatePickRequest) => api.createPick(pick),
    onSuccess: (newPick) => {
      // Invalidar los picks para que se recarguen
      queryClient.invalidateQueries({ queryKey: ['myPicks'] });
    },
  });
}

// ============================================
// LEADERBOARD HOOKS
// ============================================

/**
 * Hook para obtener el leaderboard global
 */
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

/**
 * Hook para obtener el leaderboard de un evento
 */
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

/**
 * Hook para obtener el leaderboard por categoría
 */
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

/**
 * Hook para obtener la posición del usuario actual
 */
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

/**
 * Hook para verificar el estado del backend
 */
export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: api.checkHealth,
    refetchInterval: 30 * 1000, // Cada 30 segundos
    retry: 1,
  });
}
