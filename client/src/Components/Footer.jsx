
import { Link } from 'react-router-dom'
import { assets } from '../assets/assets'

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-green-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">

        {/* Main footer content */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* Logo and description */}
          <div>
            <Link to="/" className="inline-block">
              <img
                src={assets.Icon}
                alt="ElimuPlus logo"
                className="h-14 w-auto object-contain"
              />
            </Link>

            <p className="mt-4 max-w-xs text-sm leading-7 text-green-100">
              Empowering Ganze's future through transparent,
              accessible, and accountable bursary support for
              students who need it most.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-amber-400">
              Quick Links
            </h3>

            <ul className="space-y-3 text-sm text-green-100">
              <li>
                <Link to="/" className="transition hover:text-amber-400">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="transition hover:text-amber-400">
                  About Us
                </Link>
              </li>
              <li>
                <a href="#how-it-works" className="transition hover:text-amber-400">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#contact" className="transition hover:text-amber-400">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Bursary information */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-amber-400">
              Bursary Support
            </h3>

            <ul className="space-y-3 text-sm text-green-100">
              <li>
                <a href="#eligibility" className="transition hover:text-amber-400">
                  Eligibility Requirements
                </a>
              </li>
              <li>
                <a href="#application-process" className="transition hover:text-amber-400">
                  Application Process
                </a>
              </li>
              <li>
                <a href="#required-documents" className="transition hover:text-amber-400">
                  Required Documents
                </a>
              </li>
              <li>
                <a href="#faqs" className="transition hover:text-amber-400">
                  Frequently Asked Questions
                </a>
              </li>
            </ul>
          </div>

          {/* Contact information */}
          <div id="contact">
            <h3 className="mb-4 text-lg font-semibold text-amber-400">
              Contact Us
            </h3>

            <p className="text-sm leading-7 text-green-100">
              Ganze Constituency<br />
              Kilifi County, Kenya
            </p>

            <p className="mt-3 text-sm text-green-100">
              For bursary enquiries, please contact the
              constituency office.
            </p>
          </div>
        </div>

        {/* Divider and bottom section */}
        <div className="mt-10 border-t border-green-800 pt-6">
          <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">

            <p className="text-sm text-green-200">
              © {currentYear} ElimuPlus. All rights reserved.
            </p>

            <p className="text-sm text-green-200">
              Built for a brighter future in{' '}
              <span className="font-semibold text-amber-400">
                Ganze.
              </span>
            </p>

          </div>
        </div>

      </div>
    </footer>
  )
}

export default Footer
