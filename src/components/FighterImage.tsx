'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  getFighterImageCandidates,
  getFighterImageUrl,
  FIGHTER_PLACEHOLDER,
  type Fighter,
} from '@/lib/api';

/**
 * Foto de peleador con fallback automático de extensiones.
 *
 * El backend a veces entrega una URL de CloudFront con la extensión
 * equivocada (ej: .jpg cuando el archivo en S3 es .png), devolviendo un
 * 403/404. Este componente prueba .png/.jpg/.jpeg/.webp/.avif/.gif en orden
 * y, si ninguna carga, muestra el placeholder.
 *
 * Reemplaza el patrón:
 *   <img src={getFighterImageUrl(f)} onError={e => e.currentTarget.src = placeholder} />
 */
interface FighterImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  fighter: Fighter;
  size?: 'small' | 'medium' | 'large';
}

export function FighterImage({ fighter, size = 'small', ...imgProps }: FighterImageProps) {
  const candidates = useMemo(
    () => getFighterImageCandidates(fighter, size),
    [fighter, size]
  );

  const [index, setIndex] = useState(0);

  // Reiniciar al primer candidato cuando cambia el peleador / lista.
  useEffect(() => {
    setIndex(0);
  }, [candidates]);

  return (
    <img
      {...imgProps}
      src={candidates[index] ?? FIGHTER_PLACEHOLDER}
      onError={() => {
        setIndex((current) =>
          current < candidates.length - 1 ? current + 1 : current
        );
      }}
    />
  );
}

/**
 * `<div>` con la foto del peleador aplicada como `background-image`, con el
 * mismo fallback de extensiones. Pensado para reemplazar:
 *   <div style={{ backgroundImage: `url(${getFighterImageUrl(f)})`, ... }} />
 *
 * Es un componente propio (y no inline) para poder usar el hook con seguridad
 * incluso dentro de un .map() de bouts.
 */
interface FighterPhotoProps extends React.HTMLAttributes<HTMLDivElement> {
  fighter: Fighter;
  size?: 'small' | 'medium' | 'large';
  backgroundPosition?: string;
}

export function FighterPhoto({
  fighter,
  size = 'small',
  backgroundPosition = 'center',
  style,
  children,
  ...rest
}: FighterPhotoProps) {
  const url = useResolvedFighterImage(fighter, size);
  return (
    <div
      {...rest}
      style={{
        backgroundImage: `url(${url})`,
        backgroundSize: 'cover',
        backgroundPosition,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Versión hook para casos donde la imagen se usa como `background-image`
 * (no hay evento onError disponible). Pre-carga los candidatos en orden y
 * devuelve la primera URL que cargue correctamente, o el placeholder.
 */
export function useResolvedFighterImage(
  fighter: Fighter,
  size: 'small' | 'medium' | 'large' = 'small'
): string {
  // Clave estable para no relanzar el efecto en cada render.
  const stableKey = `${getFighterImageUrl(fighter, size)}|${size}`;
  const candidates = useMemo(
    () => getFighterImageCandidates(fighter, size),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stableKey]
  );

  const [resolved, setResolved] = useState(candidates[0] ?? FIGHTER_PLACEHOLDER);

  useEffect(() => {
    let cancelled = false;
    setResolved(candidates[0] ?? FIGHTER_PLACEHOLDER);

    let i = 0;
    const tryNext = () => {
      if (cancelled) return;
      if (i >= candidates.length) return;

      const url = candidates[i];
      // El último candidato siempre es el placeholder: lo aceptamos sin probar.
      if (i === candidates.length - 1) {
        setResolved(url);
        return;
      }

      const probe = new Image();
      probe.onload = () => {
        if (!cancelled) setResolved(url);
      };
      probe.onerror = () => {
        i += 1;
        tryNext();
      };
      probe.src = url;
    };

    tryNext();
    return () => {
      cancelled = true;
    };
  }, [candidates]);

  return resolved;
}
