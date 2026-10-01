import { Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { recordCvDownload } from '../lib/analytics';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Petit effet pour changer l'opacité au scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
    setIsOpen(false);
  };

  const navLinks = [
    { id: 'about', label: 'À propos' },
    { id: 'creations', label: 'Créations' },
    { id: 'projects', label: 'Projets' },
    { id: 'technologies', label: 'Technologies' },
  ];

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
        scrolled 
          ? 'bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50 py-3' 
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center">
          
          {/* Logo avec icône Terminal */}
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <span className="text-xl font-black tracking-tighter text-white uppercase">
              Portfolio<span className="text-blue-500">.</span>
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <button 
                key={link.id}
                onClick={() => scrollToSection(link.id)} 
                className="px-4 py-2 text-sm font-bold text-zinc-400 hover:text-blue-400 hover:bg-white/5 rounded-full transition-all tracking-wide uppercase"
              >
                {link.label}
              </button>
            ))}
            <motion.a
              href="/CV-Traore-Rice-Aliman.pdf"
              download="CV_TRAORE_RICE_ALIMAN.pdf"
              onClick={() => recordCvDownload()}
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.94 }}
              className="ml-4 flex items-center gap-2 px-5 py-2 bg-blue-500 text-zinc-950 text-xs font-black rounded-full uppercase tracking-widest shadow-[0_0_0_0_rgba(10,102,194,0.6)] hover:bg-blue-400 hover:shadow-[0_0_0_8px_rgba(10,102,194,0)] transition-[background-color,box-shadow] duration-500"
            >
              Télécharger CV
            </motion.a>
          </div>

          {/* Mobile Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors"
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 top-[64px] bg-zinc-950 z-50 md:hidden flex flex-col p-8 space-y-6 border-t border-zinc-900 animate-in fade-in slide-in-from-top-4">
          {navLinks.map((link) => (
            <button 
              key={link.id}
              onClick={() => scrollToSection(link.id)} 
              className="text-4xl font-black text-left text-zinc-400 hover:text-blue-500 transition-colors tracking-tighter"
            >
              {link.label}
            </button>
          ))}
          <motion.a
            href="/CV-Traore-Rice-Aliman.pdf"
            download="CV_TRAORE_RICE_ALIMAN.pdf"
            onClick={() => recordCvDownload()}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            whileTap={{ scale: 0.94 }}
            className="flex items-center gap-2 px-5 py-3 bg-blue-500 text-zinc-950 font-bold rounded-full hover:bg-blue-400 transition-colors w-fit"
          >
            Télécharger CV
          </motion.a>

          <div className="pt-8 border-t border-zinc-900 text-zinc-600 text-sm font-mono">
            // DISPONIBLE POUR DE NOUVEAUX PROJETS
          </div>
        </div>
      )}
    </nav>
  );
}