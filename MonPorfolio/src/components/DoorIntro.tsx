import { useEffect, useMemo, useRef, useState } from 'react';
import {
  motion,
  useAnimationControls,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';
import Hero from './Hero';

type Phase = 'idle' | 'opening';

const NAME = 'Traoré Rice-Aliman';
const PROMPT = 'Cliquez sur la porte pour entrer';
const WORDS = [
  { t: 'Innovation', x: 8, y: 18 },
  { t: 'Design', x: 14, y: 52 },
  { t: 'React', x: 80, y: 16 },
  { t: 'Code', x: 86, y: 48 },
  { t: 'Performance', x: 10, y: 82 },
  { t: 'TypeScript', x: 84, y: 80 },
  { t: 'UX/UI', x: 24, y: 30 },
  { t: 'Vision', x: 70, y: 66 },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Props {
  /** Appelé quand la page principale doit être montée (sous l'intro). */
  onReveal: () => void;
  /** Appelé quand l'intro est totalement terminée. */
  onDone: () => void;
}

export default function DoorIntro({ onReveal, onDone }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [hover, setHover] = useState(false);
  const reduce = useReducedMotion();

  const door = useAnimationControls();
  const scene = useAnimationControls();
  const root = useAnimationControls();
  const ui = useAnimationControls();
  const glow = useAnimationControls();
  const sceneRef = useRef<HTMLDivElement>(null);
  const doorwayRef = useRef<HTMLDivElement>(null);
  const [k0, setK0] = useState(0.15);
  const [ready, setReady] = useState(false);
  const [vw, setVw] = useState(() => document.documentElement.clientWidth);
  const [vh, setVh] = useState(() => window.innerHeight);

  // Parallaxe souris
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const sy = useSpring(my, { stiffness: 60, damping: 18 });
  const bgX = useTransform(sx, [-1, 1], [18, -18]);
  const bgY = useTransform(sy, [-1, 1], [12, -12]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const move = (e: PointerEvent) => {
      mx.set((e.clientX / window.innerWidth - 0.5) * 2);
      my.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener('pointermove', move);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('pointermove', move);
    };
  }, [mx, my]);

  // Taille de la page miniature = largeur de l'embrasure / largeur de l'écran
  useEffect(() => {
    const measure = () => {
      const w = document.documentElement.clientWidth;
      setVw(w);
      setVh(window.innerHeight);
      if (doorwayRef.current) setK0(doorwayRef.current.getBoundingClientRect().width / w);
    };
    measure();
    // l'encadrement finit son animation d'entrée (échelle) avant qu'on mesure pour de bon
    const t = setTimeout(() => {
      measure();
      setReady(true);
    }, 1600);
    window.addEventListener('resize', measure);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', measure);
    };
  }, []);

  const dust = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 1.5 + Math.random() * 3,
        duration: 9 + Math.random() * 9,
        delay: Math.random() * 9,
      })),
    []
  );

  const open = async () => {
    if (phase !== 'idle' || !ready) return;
    setPhase('opening');
    setHover(false);

    if (reduce) {
      onReveal();
      await root.start({ opacity: 0, transition: { duration: 0.5 } });
      onDone();
      return;
    }

    ui.start({ opacity: 0, transition: { duration: 0.5, ease: 'easeInOut' } });

    // Mesure : on vise le centre de l'embrasure, et on grossit jusqu'à ce que
    // la page miniature remplisse exactement l'écran.
    const sc = sceneRef.current!.getBoundingClientRect();
    const dw = doorwayRef.current!.getBoundingClientRect();
    const cx = dw.left + dw.width / 2;
    const cy = dw.top + dw.height / 2;
    scene.set({
      originX: (cx - sc.left) / sc.width,
      originY: (cy - sc.top) / sc.height,
    });
    const zoom = 1 / k0;
    const dx = document.documentElement.clientWidth / 2 - cx;
    const dy = window.innerHeight / 2 - cy;

    // 1 — la porte s'ouvre et laisse voir le site à l'intérieur
    door.start({
      rotateY: -100,
      opacity: [1, 1, 0],
      transition: {
        rotateY: { duration: 1.4, ease: [0.45, 0, 0.2, 1] },
        opacity: { duration: 1.4, times: [0, 0.5, 1] },
      },
    });

    // 2 — la caméra entre dans l'embrasure, longue glissade qui s'adoucit à l'arrivée
    await sleep(700);
    // la lueur du cadre s'éteint pendant le zoom (sinon elle bave sur les bords de l'écran)
    glow.start({ opacity: 0, transition: { duration: 1.9, ease: 'easeIn' } });
    await scene.start({
      x: dx,
      y: dy,
      scale: zoom,
      transition: { duration: 2.4, ease: [0.6, 0, 0.15, 1] },
    });

    // 3 — la vraie page prend le relais, à l'identique
    onReveal();
    await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(() => res(null))));
    await root.start({ opacity: 0, transition: { duration: 0.18, ease: 'linear' } });
    onDone();
  };

  return (
    <motion.div
      animate={root}
      initial={{ opacity: 1 }}
      className="fixed inset-0 z-[100] overflow-hidden bg-zinc-950 select-none"
    >
      {/* Fond identique au Hero */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black" />
      <motion.div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          x: bgX,
          y: bgY,
          backgroundImage:
            'linear-gradient(rgba(74,158,221,1) 1px, transparent 1px), linear-gradient(90deg, rgba(74,158,221,1) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage: 'radial-gradient(ellipse at 50% 55%, black 0%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 55%, black 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 60%, rgba(10,102,194,0.22) 0%, transparent 55%)',
        }}
      />

      {/* Mots flottants (comme le Hero) */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ x: bgX, y: bgY }}
        animate={{ opacity: phase === 'idle' ? 1 : 0 }}
        transition={{ duration: 0.4 }}
      >
        {WORDS.map((w, i) => (
          <motion.span
            key={w.t}
            className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-black text-sm sm:text-xl lg:text-2xl text-blue-400/15"
            style={{ left: `${w.x}%`, top: `${w.y}%` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, -18, 0] }}
            transition={{
              opacity: { delay: 0.4 + i * 0.15, duration: 1.2 },
              y: { duration: 4 + (i % 3), repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 },
            }}
          >
            {w.t}
          </motion.span>
        ))}
      </motion.div>

      {/* Poussière lumineuse */}
      {phase === 'idle' && dust.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full bg-blue-300/50"
          style={{ left: `${p.left}%`, bottom: -10, width: p.size, height: p.size }}
          animate={{ y: [0, -1100], opacity: [0, 0.8, 0] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'linear' }}
        />
      ))}

      {/* Scène : encadrement + porte */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        style={{ paddingTop: 0, perspective: 1500 }}
      >
        <motion.div
          ref={sceneRef}
          animate={scene}
          initial={{ scale: 1 }}
          style={{ transformStyle: 'preserve-3d' }}
          className="relative"
        >
          {/* Halo bleu */}
          <motion.div
            className="absolute -inset-20 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(31,131,207,0.4), transparent 65%)' }}
            animate={{ opacity: phase !== 'idle' ? 0 : hover ? 0.6 : [0.2, 0.35, 0.2] }}
            transition={hover ? { duration: 0.4 } : { duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Ombre/lumière au sol */}
          <motion.div
            className="absolute left-1/2 -bottom-6 h-10 w-[140%] -translate-x-1/2 rounded-[50%] blur-xl"
            style={{ background: 'radial-gradient(ellipse, rgba(74,158,221,0.55), transparent 70%)' }}
            animate={{ opacity: phase !== 'idle' ? 0 : hover ? 1 : 0.5 }}
            transition={{ duration: 0.8 }}
          />

          {/* Encadrement */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative aspect-[5/8] h-[62vh] max-h-[700px] min-h-[340px] rounded-t-[999px] p-[10px]"
            style={{
              background: 'linear-gradient(160deg,#27272a,#09090b 60%,#18181b)',
              boxShadow:
                '0 40px 90px rgba(0,0,0,0.9), 0 0 0 1px rgba(74,158,221,0.3), inset 0 0 0 1px rgba(255,255,255,0.08), inset 0 0 0 4px #0c0c0e, inset 0 0 0 5px rgba(74,158,221,0.25)',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Embrasure : le vrai site, en miniature */}
            <div
              ref={doorwayRef}
              className="relative h-full w-full overflow-hidden rounded-t-[999px] bg-zinc-950"
              aria-hidden
            >
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black" />
              <div
                className="hero-freeze pointer-events-none absolute left-1/2 top-1/2 overflow-hidden"
                style={{
                  width: `${vw}px`,
                  height: `${vh}px`,
                  transform: `translate(-50%, -50%) scale(${k0})`,
                  transformOrigin: 'center',
                }}
              >
                <Hero preview />
              </div>
              {/* lueur de l'embrasure */}
              <motion.div
                animate={glow}
                initial={{ opacity: 1 }}
                className="pointer-events-none absolute inset-0 rounded-t-[999px]"
                style={{ boxShadow: 'inset 0 0 28px rgba(31,131,207,0.45)' }}
              />
            </div>

            {/* Porte (charnière à gauche) */}
            <div className="absolute inset-[13px]" style={{ transformStyle: 'preserve-3d' }}>
              <motion.div
                animate={door}
                initial={{ rotateY: 0 }}
                className="relative h-full w-full"
                style={{ transformOrigin: 'left center', transformStyle: 'preserve-3d' }}
              >
                {/* Face */}
                <motion.button
                  type="button"
                  aria-label="Ouvrir la porte et entrer sur le site"
                  onClick={open}
                  onHoverStart={() => {
                    if (phase !== 'idle') return;
                    setHover(true);
                    door.start({ rotateY: -16, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } });
                  }}
                  onHoverEnd={() => {
                    if (phase !== 'idle') return;
                    setHover(false);
                    door.start({ rotateY: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } });
                  }}
                  onFocus={() => phase === 'idle' && setHover(true)}
                  onBlur={() => setHover(false)}
                  className="relative block h-full w-full cursor-pointer overflow-hidden rounded-t-[999px] [container-type:inline-size] outline-none focus-visible:ring-4 focus-visible:ring-blue-400"
                  style={{
                    background: 'linear-gradient(150deg,#1e3a5f 0%,#13243b 55%,#0a1220 100%)',
                    boxShadow: 'inset 0 0 0 2px rgba(74,158,221,0.35), inset 0 0 50px rgba(0,0,0,0.5)',
                    backfaceVisibility: 'hidden',
                  }}
                >
                  {/* Panneaux moulurés */}
                  <div
                    className="absolute inset-[8%] rounded-t-[999px]"
                    style={{
                      background: 'linear-gradient(170deg, rgba(74,158,221,0.14), rgba(10,102,194,0.04) 60%)',
                      boxShadow:
                        'inset 0 0 0 1px rgba(147,197,253,0.35), inset 0 6px 18px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.06)',
                    }}
                  />
                  <div
                    className="absolute inset-[16%] bottom-[44%] rounded-t-[999px]"
                    style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1), inset 0 4px 12px rgba(0,0,0,0.45)' }}
                  />
                  <div
                    className="absolute inset-x-[16%] bottom-[14%] top-[60%] rounded-sm"
                    style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1), inset 0 4px 12px rgba(0,0,0,0.45)' }}
                  />
                  {/* Pancarte accrochée à la porte */}
                  <div className="pointer-events-none absolute left-[20%] top-[7%] w-[60%]">
                    <motion.div
                      className="flex flex-col items-center"
                      style={{ transformOrigin: '50% 0%' }}
                      initial={{ rotate: -3 }}
                      animate={{ rotate: [-3, 3, -3] }}
                      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      {/* clou */}
                      <div className="h-[2.6cqw] w-[2.6cqw] rounded-full bg-zinc-400 shadow-[0_1px_2px_rgba(0,0,0,0.7)]" />
                      {/* ficelle (une boucle simple vers le trou) */}
                      <svg viewBox="0 0 20 30" className="-mt-[0.6cqw] h-[9cqw] w-[6cqw]" fill="none">
                        <path d="M10 1 C 1 10, 4 22, 10 29 C 16 22, 19 10, 10 1" stroke="#d6cdb8" strokeWidth="1.6" strokeLinejoin="round" />
                      </svg>

                      {/* carte */}
                      <div
                        className="relative -mt-[2.4cqw] w-full rounded-[2.4cqw] bg-[#efeadf] px-[3cqw] pb-[6cqw] pt-[8cqw] text-center"
                        style={{ boxShadow: '0 5px 10px rgba(0,0,0,0.45)' }}
                      >
                        <div className="absolute inset-[1.6cqw] rounded-[1.4cqw] border-2 border-[#0b2a4a]" />
                        {/* trou renforcé */}
                        <span className="absolute left-1/2 top-[2.6cqw] h-[3.4cqw] w-[3.4cqw] -translate-x-1/2 rounded-full bg-[#0f1b2b] ring-[0.9cqw] ring-[#d9d2c0]" />
                        <p className="relative whitespace-nowrap text-[7.6cqw] font-extrabold leading-[1.1] tracking-tight text-[#0b2a4a]">
                          {NAME.slice(0, 6)}
                          <br />
                          {NAME.slice(7)}
                        </p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Poignée */}
                  <div
                    className="absolute right-[7%] top-1/2 h-[9%] w-[4.5%] min-w-[9px] -translate-y-1/2 rounded-full"
                    style={{
                      background: 'linear-gradient(135deg,#fff,#a8c8e8 50%,#4a6b8a)',
                      boxShadow: '0 0 12px rgba(74,158,221,0.8), 0 2px 6px rgba(0,0,0,0.6)',
                    }}
                  />
                  {/* Reflet balayant */}
                  <motion.div
                    className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ left: '-40%' }}
                    animate={{ left: ['-40%', '140%'] }}
                    transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 2.6, ease: 'easeInOut' }}
                  />
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Invitation */}
      <motion.div
        animate={ui}
        className="absolute bottom-[3vh] left-0 right-0 z-20 flex flex-col items-center gap-2 px-6 text-center"
      >
        <p className="rounded-lg border border-blue-500/30 bg-zinc-900/80 px-5 py-2.5 text-sm sm:text-base font-medium text-white backdrop-blur-sm">
          {PROMPT}
        </p>
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ y: [0, -8, 0] }}
          transition={{
            y: {  duration: 1.4, repeat: Infinity, ease: 'easeInOut' },
          }}
          className="text-blue-400"
          aria-hidden
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </motion.div>
      </motion.div>

    </motion.div>
  );
}
