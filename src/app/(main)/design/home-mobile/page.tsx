import { HomeMobileGallery } from '@/components/design-system-v2/gallery/HomeMobileGallery';

export const metadata = {
  title: 'Home en móvil — opciones — UFC Picks',
};

/**
 * Galería local para elegir cómo se arma la home en un teléfono.
 *
 * Cinco arreglos numerados de los mismos bloques, cada uno dentro de una
 * pantalla de 390px que sí scrollea, para decidir mirando y no leyendo.
 * No consume la API y no enlaza a ninguna ruta del producto.
 */
export default function HomeMobileDesignPage() {
  return <HomeMobileGallery />;
}
