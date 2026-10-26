import { useState } from 'react'
import { Link } from 'react-router-dom'
import { assets } from '../assets/assets'

function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  const closeMenu = () => setIsOpen(false)

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
  ]

  return (
    <>
      {/* Main Navbar */}
      <nav className="sticky top-0 z-40 border-b border-gray-100 bg-white shadow-sm">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* Logo */}
          <Link
            to="/"
            onClick={closeMenu}
            className="flex shrink-0 items-center"
          >
            <img
              src={assets.Icon}
              alt="ElimuPlus"
              className="h-12 w-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="font-medium text-gray-700 transition hover:text-green-800"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={isOpen}
            className="rounded-lg p-2 text-green-900 transition hover:bg-green-50 md:hidden"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-7 w-7"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Overlay and Side Menu */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">

          {/* Background Overlay */}
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={closeMenu}
            className="absolute inset-0 h-full w-full bg-black/50"
          />

          {/* Side Drawer */}
          <aside
            className="absolute right-0 top-0 flex h-full w-4/5 max-w-sm flex-col bg-white shadow-2xl"
            aria-label="Mobile navigation"
          >
            {/* Drawer Header */}
            <div className="flex h-20 items-center justify-between border-b border-gray-100 px-5">
              <Link to="/" onClick={closeMenu}>
                <img
                  src={assets.logo}
                  alt="ElimuPlus"
                  className="h-11 w-auto object-contain"
                />
              </Link>

              <button
                type="button"
                onClick={closeMenu}
                aria-label="Close navigation menu"
                className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-green-800"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Mobile Navigation Links */}
            <div className="flex flex-1 flex-col gap-2 px-5 py-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={closeMenu}
                  className="rounded-lg px-4 py-3 font-medium text-gray-700 transition hover:bg-green-50 hover:text-green-800"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Drawer Footer */}
            <div className="border-t border-gray-100 px-6 py-5">
              <p className="text-center text-sm text-gray-500">
                Empowering Ganze's Future
              </p>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}

export default Navbar