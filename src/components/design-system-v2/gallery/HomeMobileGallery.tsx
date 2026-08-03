'use client';

/**
 * Cinco arreglos para la home en móvil.
 *
 * Todos usan los MISMOS fundamentales que ya existen: póster del evento con su
 * badge, título y fecha, EVENT STATS, el reloj de cuenta regresiva y el botón
 * primario. Lo único que cambia es cómo se acomodan y cuánto espacio se le da
 * al arte. Nada de esto está cableado a la API ni enlaza al producto.
 *
 * El problema que resuelven: hoy en móvil la home son cuatro paneles con borde
 * apilados dentro del gutter de la página, así que el póster queda chico y
 * ningún bloque manda. Cada variante quita paneles y le devuelve el ancho
 * completo al arte, con distinto grado de agresividad.
 */

import React from 'react';
import './home-mobile-gallery.css';

const EVENT = {
  kicker: 'UFC FIGHT NIGHT',
  title: 'GAMROT',
  rival: 'SALKILLD',
  date: 'SAT, AUG 08, 2026',
  venue: 'UFC APEX',
  fights: 12,
  titles: 1,
  status: 'OPEN FOR PICKS',
};

const CLOCK = [
  ['04', 'DAYS'],
  ['12', 'HOURS'],
  ['33', 'MIN'],
  ['07', 'SEC'],
] as const;

// ---------------------------------------------------------------------------
// Arte de muestra
// ---------------------------------------------------------------------------

/**
 * Póster de muestra dibujado en SVG.
 *
 * Es un asset local y no una URL remota: la galería tiene que poder juzgarse
 * sin depender de qué evento haya sembrado la base ni de que CloudFront
 * responda. `slice` deja que el mismo dibujo sirva para recortes 3:2 y 3:4 sin
 * deformar las caras.
 */
function PosterArt() {
  /**
   * Un busto: cabeza, cuello y hombros con luz de contorno por el lado
   * exterior, que es como se iluminan los pósters oficiales. `dir` -1 mira a
   * la derecha y +1 a la izquierda, para que los dos se enfrenten.
   */
  const bust = (cx: number, rim: string, dir: 1 | -1, id: string) => {
    const headY = 620;
    const rx = 150;
    const ry = 190;
    // Los hombros arrancan alto y a propósito: recortados más abajo, en un
    // encuadre 3:2 la figura quedaba en cabeza y cuello sueltos.
    const shoulder = `M${cx - 360},1500 C${cx - 348},1090 ${cx - 186},900 ${cx},900 C${cx + 186},900 ${cx + 348},1090 ${cx + 360},1500 Z`;
    return (
      <g key={id}>
        <rect x={cx - 74} y={headY + 110} width="148" height="200" fill="#15151a" />
        <path d={shoulder} fill={`url(#${id}-body)`} />
        <ellipse cx={cx} cy={headY} rx={rx} ry={ry} fill={`url(#${id}-head)`} />
        {/* masa de pelo: sin ella la cabeza lee como un óvalo vacío */}
        <path
          d={`M${cx - rx},${headY - 30} C${cx - rx + 8},${headY - ry - 34} ${cx + rx - 8},${headY - ry - 34} ${cx + rx},${headY - 30} C${cx + 74},${headY - ry + 46} ${cx - 74},${headY - ry + 46} ${cx - rx},${headY - 30} Z`}
          fill="#0b0b0f"
        />
        {/* luz de contorno por el lado exterior, que es como se iluminan los
            pósters oficiales */}
        <g
          stroke={rim}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          transform={dir === -1 ? `matrix(-1 0 0 1 ${2 * cx} 0)` : undefined}
        >
          <path
            d={`M${cx - rx + 4},${headY - 56} C${cx - rx - 2},${headY + 96} ${cx - 92},${headY + ry - 8} ${cx - 8},${headY + ry}`}
            opacity="0.95"
          />
          <path
            d={`M${cx - 360},1500 C${cx - 348},1090 ${cx - 186},900 ${cx},900`}
            opacity="0.8"
          />
        </g>
      </g>
    );
  };

  return (
    <svg
      className="hmg-art"
      viewBox="0 0 1200 1500"
      preserveAspectRatio="xMidYMid slice"
      aria-label="Arte de muestra del evento"
      role="img"
    >
      <defs>
        <radialGradient id="hmg-spot" cx="50%" cy="34%" r="62%">
          <stop offset="0%" stopColor="#2b2b33" />
          <stop offset="100%" stopColor="#08080a" />
        </radialGradient>
        <radialGradient id="hmg-glow-r" cx="22%" cy="46%" r="40%">
          <stop offset="0%" stopColor="#e11d1d" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#e11d1d" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hmg-glow-b" cx="78%" cy="46%" r="40%">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="red-head" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#4a2b2b" />
          <stop offset="65%" stopColor="#1b1a1f" />
        </linearGradient>
        <linearGradient id="red-body" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3a1e1e" />
          <stop offset="75%" stopColor="#15151a" />
        </linearGradient>
        <linearGradient id="blue-head" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#26344f" />
          <stop offset="65%" stopColor="#1b1a1f" />
        </linearGradient>
        <linearGradient id="blue-body" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="#1d2740" />
          <stop offset="75%" stopColor="#15151a" />
        </linearGradient>
      </defs>

      <rect width="1200" height="1500" fill="url(#hmg-spot)" />
      <rect width="1200" height="1500" fill="url(#hmg-glow-r)" />
      <rect width="1200" height="1500" fill="url(#hmg-glow-b)" />
      {bust(300, '#e11d1d', 1, 'red')}
      {bust(900, '#3b82f6', -1, 'blue')}
      {/* costura central, el eco de la diagonal de la tarjeta de main event */}
      <path d="M586,-60 L646,1560 L616,1560 L556,-60 Z" fill="#000" opacity="0.4" />
    </svg>
  );
}

function Badge() {
  return <span className="hmg-badge">{EVENT.status}</span>;
}

function Title({ size = 'lg' }: { size?: 'lg' | 'md' }) {
  return (
    <div className={`hmg-title hmg-title--${size}`}>
      <span className="hmg-title__kicker">{EVENT.kicker}</span>
      <span className="hmg-title__names">
        <em>{EVENT.title}</em> VS {EVENT.rival}
      </span>
    </div>
  );
}

function Meta() {
  return (
    <p className="hmg-meta">
      {EVENT.date} // {EVENT.venue}
    </p>
  );
}

/** `flush` = sin margen, dentro de un bloque. `pinned` = clavado al borde
 *  inferior del póster, encima del arte. */
function Cta({ variant }: { variant?: 'flush' | 'pinned' }) {
  return (
    <a className={`hmg-cta ${variant ? `hmg-cta--${variant}` : ''}`}>
      MAKE YOUR PICKS <span>→</span>
    </a>
  );
}

/** Chips de conteo: los mismos dos números de EVENT STATS, sin el panel. */
function CountChips() {
  return (
    <div className="hmg-chips">
      <span className="hmg-chip">
        <b>{EVENT.fights}</b> FIGHTS
      </span>
      <span className="hmg-chip">
        <b>{EVENT.titles}</b> TITLE
      </span>
    </div>
  );
}

function Clock({ tight = false }: { tight?: boolean }) {
  return (
    <div className={`hmg-clock ${tight ? 'hmg-clock--tight' : ''}`}>
      {CLOCK.map(([value, unit]) => (
        <div className="hmg-clock__cell" key={unit}>
          <b>{value}</b>
          <i>{unit}</i>
        </div>
      ))}
    </div>
  );
}

/** El reloj como una sola línea, para cuando va encima del arte. */
function ClockLine() {
  return (
    <div className="hmg-clockline">
      <span className="hmg-clockline__label">LOCKS IN</span>
      <span className="hmg-clockline__value">
        {CLOCK.map(([value, unit], i) => (
          <React.Fragment key={unit}>
            {i > 0 && <i>:</i>}
            {value}
            <small>{unit.charAt(0)}</small>
          </React.Fragment>
        ))}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Marco: lo que rodea a cada variante es siempre igual, para que se comparen
// los arreglos y no el cromo.
// ---------------------------------------------------------------------------

function Peek() {
  return (
    <div className="hmg-peek">
      <span className="hmg-peek__chip">MAIN EVENT</span>
      <div className="hmg-peek__card">
        <span className="hmg-peek__corner">RED CORNER</span>
        <span className="hmg-peek__name">MATEUSZ GAMROT</span>
      </div>
    </div>
  );
}

function Frame({
  n,
  name,
  note,
  children,
}: {
  n: string;
  name: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <figure className="hmg-item">
      <figcaption className="hmg-cap">
        <b>{n}</b>
        <span className="hmg-cap__name">{name}</span>
        <span className="hmg-cap__note">{note}</span>
      </figcaption>
      <div className="hmg-phone">
        <div className="hmg-screen">
          <header className="hmg-nav">
            <span className="hmg-nav__logo">UFC PICKS</span>
          </header>
          <div className="hmg-body">{children}</div>
          <nav className="hmg-tabs">
            {['HOME', 'EVENTS', 'PICKS', 'RANKS', 'PROFILE'].map((t, i) => (
              <span key={t} className={i === 0 ? 'is-on' : ''}>
                {t}
              </span>
            ))}
          </nav>
        </div>
      </div>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// Las cinco variantes
// ---------------------------------------------------------------------------

export function HomeMobileGallery() {
  return (
    <div className="hmg">
      <header className="hmg-head">
        <h1 className="hmg-head__title">HOME EN MÓVIL — OPCIONES</h1>
        <p className="hmg-head__sub">
          Cinco arreglos de los mismos bloques que ya existen. Cambia el espacio
          que recibe el arte y cuántos paneles sobreviven; no cambian los datos,
          los tokens ni la navegación. Cada pantalla scrollea.
        </p>
        <p className="hmg-head__now">
          <b>Hoy:</b> póster 3:2 dentro del gutter, y debajo tres paneles con
          borde (EVENT STATS, reloj, botón). Cuatro cajas del mismo peso, ninguna
          manda, y el arte queda a media pantalla.
        </p>
        <p className="hmg-head__now">
          <b>El arte es de muestra</b> y está dibujado local a propósito: la
          comparación tiene que sostenerse sin depender de qué evento haya
          sembrado la base. En el producto ese hueco lo llena el póster oficial
          por el mismo camino de imagen de siempre.
        </p>
      </header>

      <div className="hmg-grid">
        {/* ---------------------------------------------------------------- */}
        <Frame
          n="01"
          name="FULL BLEED"
          note="El póster rompe el gutter y se lleva el ancho completo. Sobreviven el reloj y el botón."
        >
          <section className="hmg-hero hmg-hero--bleed">
            <div className="hmg-poster hmg-poster--45">
              <PosterArt />
              <Badge />
              <div className="hmg-poster__foot">
                <Title />
                <Meta />
                <CountChips />
              </div>
            </div>
            <div className="hmg-gut">
              <Clock tight />
              <Cta />
            </div>
          </section>
          <Peek />
        </Frame>

        {/* ---------------------------------------------------------------- */}
        <Frame
          n="02"
          name="TAKEOVER"
          note="Todo encima del arte: badge, título, cuenta regresiva en una línea y el botón pegado al borde inferior."
        >
          <section className="hmg-hero hmg-hero--bleed">
            <div className="hmg-poster hmg-poster--34">
              <PosterArt />
              <Badge />
              <div className="hmg-poster__foot">
                <Title />
                <Meta />
                <ClockLine />
              </div>
              <Cta variant="pinned" />
            </div>
          </section>
          <Peek />
        </Frame>

        {/* ---------------------------------------------------------------- */}
        <Frame
          n="03"
          name="TICKET"
          note="Respeta el 3:2 oficial (el póster nunca se recorta) y le pega debajo una sola tira de datos."
        >
          <section className="hmg-hero hmg-hero--bleed">
            <div className="hmg-poster hmg-poster--32">
              <PosterArt />
              <Badge />
              <div className="hmg-poster__foot">
                <Title size="md" />
              </div>
            </div>
            <div className="hmg-stub">
              <div className="hmg-stub__row">
                <ClockLine />
              </div>
              <div className="hmg-stub__row hmg-stub__row--split">
                <Meta />
                <CountChips />
              </div>
              <Cta variant="flush" />
            </div>
          </section>
          <Peek />
        </Frame>

        {/* ---------------------------------------------------------------- */}
        <Frame
          n="04"
          name="HUD 2×2"
          note="Lo más cercano a hoy: mismo póster a lo ancho, pero reloj y stats comparten una fila en vez de dos paneles."
        >
          <section className="hmg-hero hmg-hero--bleed">
            <div className="hmg-poster hmg-poster--32">
              <PosterArt />
              <Badge />
              <div className="hmg-poster__foot">
                <Title size="md" />
                <Meta />
              </div>
            </div>
            <div className="hmg-gut">
              <div className="hmg-hud">
                <Clock tight />
                <div className="hmg-hud__stats">
                  <div>
                    <b>{EVENT.fights}</b>
                    <i>TOTAL FIGHTS</i>
                  </div>
                  <div>
                    <b>{EVENT.titles}</b>
                    <i>TITLE FIGHTS</i>
                  </div>
                </div>
              </div>
              <Cta />
            </div>
          </section>
          <Peek />
        </Frame>

        {/* ---------------------------------------------------------------- */}
        <Frame
          n="05"
          name="CARTEL"
          note="Conserva el panel con borde y sombra dura de V2, pero en vertical y con los datos como chips que se deslizan."
        >
          <section className="hmg-hero">
            <div className="hmg-gut">
              <div className="hmg-card">
                <div className="hmg-poster hmg-poster--45">
                  <PosterArt />
                  <Badge />
                  <div className="hmg-poster__foot">
                    <Title />
                    <Meta />
                  </div>
                </div>
              </div>
              <div className="hmg-rail">
                <span className="hmg-rail__chip hmg-rail__chip--wide">
                  <b>04:12:33:07</b>
                  <i>LOCKS IN</i>
                </span>
                <span className="hmg-rail__chip">
                  <b>{EVENT.fights}</b>
                  <i>FIGHTS</i>
                </span>
                <span className="hmg-rail__chip">
                  <b>{EVENT.titles}</b>
                  <i>TITLE</i>
                </span>
              </div>
              <Cta />
            </div>
          </section>
          <Peek />
        </Frame>
      </div>
    </div>
  );
}
