import * as React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui'
import boneco from '@/assets/queroExtra-boneco.png'

export function LandingHeader() {
  const [scrolled, setScrolled] = React.useState(false)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const { pathname } = useLocation()

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const closeMenu = () => setMenuOpen(false)

  return (
    <header
      className={[
        'fixed top-0 left-0 right-0 z-50 h-16 bg-qe-white border-b border-qe-gray-200 transition-all duration-200',
        scrolled ? 'backdrop-blur-sm bg-white/90 shadow-qe-sm' : '',
      ].join(' ')}
    >
      <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src={boneco} alt="" className="h-9 w-auto" aria-hidden="true" />
          <span className="text-[22px] font-bold font-sans leading-none tracking-[-0.5px]">
            <span className="text-qe-navy">Quero</span>
            <span className="text-qe-yellow">Extra</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            to="/"
            className={`text-[15px] font-sans transition-colors ${
              pathname === '/'
                ? 'font-semibold text-qe-gray-900 relative pb-0.5 after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-[2px] after:bg-qe-yellow after:rounded-full'
                : 'font-medium text-qe-gray-500 hover:text-qe-gray-900'
            }`}
          >
            Início
          </Link>
          <Link
            to="/para-freelancers"
            className={`text-[15px] font-sans transition-colors ${
              pathname === '/para-freelancers'
                ? 'font-semibold text-qe-gray-900 relative pb-0.5 after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-[2px] after:bg-qe-yellow after:rounded-full'
                : 'font-medium text-qe-gray-500 hover:text-qe-gray-900'
            }`}
          >
            Para Freelancers
          </Link>
          <Link
            to="/para-empresas"
            className={`text-[15px] font-sans transition-colors ${
              pathname === '/para-empresas'
                ? 'font-semibold text-qe-gray-900 relative pb-0.5 after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-[2px] after:bg-qe-yellow after:rounded-full'
                : 'font-medium text-qe-gray-500 hover:text-qe-gray-900'
            }`}
          >
            Para Empresas
          </Link>
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-2.5">
          <Link to="/login">
            <Button variant="secondary" size="sm">Entrar</Button>
          </Link>
          <Link to="/cadastro">
            <Button variant="primary" size="sm">Anunciar vaga</Button>
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden flex items-center justify-center w-10 h-10 text-qe-gray-900 rounded-qe-sm hover:bg-qe-gray-100 transition-colors"
          onClick={() => setMenuOpen(prev => !prev)}
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="md:hidden absolute top-16 left-0 right-0 bg-qe-white border-b border-qe-gray-200 px-4 py-4 flex flex-col gap-1 shadow-qe-md"
          >
            <Link
              to="/"
              className={`text-[16px] py-3 font-sans border-b border-qe-gray-100 ${
                pathname === '/' ? 'font-bold text-qe-gray-900' : 'font-medium text-qe-gray-700'
              }`}
              onClick={closeMenu}
            >
              Início
            </Link>
            <Link
              to="/para-freelancers"
              className={`text-[16px] py-3 font-sans border-b border-qe-gray-100 ${
                pathname === '/para-freelancers' ? 'font-bold text-qe-gray-900' : 'font-medium text-qe-gray-700'
              }`}
              onClick={closeMenu}
            >
              Para Freelancers
            </Link>
            <Link
              to="/para-empresas"
              className={`text-[16px] py-3 font-sans border-b border-qe-gray-100 ${
                pathname === '/para-empresas' ? 'font-bold text-qe-gray-900' : 'font-medium text-qe-gray-700'
              }`}
              onClick={closeMenu}
            >
              Para Empresas
            </Link>
            <div className="flex flex-col gap-2 pt-3">
              <Link to="/login" onClick={closeMenu} className="block">
                <Button variant="secondary" size="lg">Entrar</Button>
              </Link>
              <Link to="/cadastro" onClick={closeMenu} className="block">
                <Button variant="primary" size="lg">Anunciar vaga</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
