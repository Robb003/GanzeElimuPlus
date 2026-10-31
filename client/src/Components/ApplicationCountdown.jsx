
import React, { useEffect, useState } from 'react';
import { getActiveBursaryCycle } from '../Service/api';

export default function ApplicationCountdown() {
  const [cycle, setCycle] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [status, setStatus] = useState('Loading');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch the active bursary cycle
  useEffect(() => {
    const fetchCycle = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await getActiveBursaryCycle();

        if (!response.data) {
          setCycle(null);
          setStatus('Unavailable');
          return;
        }

        setCycle(response.data);
      } catch (err) {
        console.error('Failed to fetch bursary cycle:', err);

        setError(
          err.response?.data?.message ||
          'Unable to load the application period.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCycle();
  }, []);

  // Calculate countdown every second
  useEffect(() => {
    if (!cycle) return;

    const calculateCountdown = () => {
      const now = new Date();
      const openingDate = new Date(cycle.openingDate);
      const closingDate = new Date(cycle.closingDate);

      let targetDate;
      let currentStatus;

      if (!cycle.isActive) {
        setStatus('Unavailable');
        setTimeLeft(null);
        return;
      }

      if (now < openingDate) {
        targetDate = openingDate;
        currentStatus = 'Upcoming';
      } else if (now <= closingDate) {
        targetDate = closingDate;
        currentStatus = 'Open';
      } else {
        setStatus('Closed');
        setTimeLeft(null);
        return;
      }

      const difference = Math.max(
        0,
        targetDate.getTime() - now.getTime()
      );

      const days = Math.floor(
        difference / (1000 * 60 * 60 * 24)
      );

      const hours = Math.floor(
        (difference / (1000 * 60 * 60)) % 24
      );

      const minutes = Math.floor(
        (difference / (1000 * 60)) % 60
      );

      const seconds = Math.floor(
        (difference / 1000) % 60
      );

      setStatus(currentStatus);
      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateCountdown();

    const timer = setInterval(calculateCountdown, 1000);

    return () => clearInterval(timer);
  }, [cycle]);

  // Format dates using Kenyan time
  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-KE', {
      timeZone: 'Africa/Nairobi',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const countdownItems = [
    { label: 'Days', value: timeLeft?.days },
    { label: 'Hours', value: timeLeft?.hours },
    { label: 'Minutes', value: timeLeft?.minutes },
    { label: 'Seconds', value: timeLeft?.seconds },
  ];

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <p className="text-gray-500">
          Loading application period...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="font-medium text-red-700">{error}</p>
      </div>
    );
  }

  if (!cycle || status === 'Unavailable') {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center">
        <h3 className="text-xl font-bold text-gray-800">
          No Active Bursary Cycle
        </h3>
        <p className="mt-2 text-gray-600">
          There is currently no active bursary application period.
        </p>
      </div>
    );
  }

  const isOpen = status === 'Open';
  const isUpcoming = status === 'Upcoming';

  return (
    <section className="w-full">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">

        {/* Header */}
        <div className="bg-[#14532D] px-6 py-7 text-center text-white sm:px-10">
          <span
            className={`inline-flex rounded-full px-4 py-1.5 text-sm font-semibold ${
              isOpen
                ? 'bg-emerald-100 text-emerald-800'
                : isUpcoming
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-gray-200 text-gray-800'
            }`}
          >
            {status === 'Open'
              ? 'Applications Open'
              : status === 'Upcoming'
                ? 'Applications Opening Soon'
                : 'Applications Closed'}
          </span>

          <h2 className="mt-4 text-2xl font-bold sm:text-3xl">
            {cycle.cycleName}
          </h2>

          <p className="mt-2 text-sm text-green-100 sm:text-base">
            {isOpen
              ? 'Time remaining before applications close'
              : isUpcoming
                ? 'Time remaining until applications open'
                : 'The application period has ended'}
          </p>
        </div>

        {/* Countdown */}
        <div className="px-5 py-8 sm:px-10">

          {timeLeft && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
              {countdownItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-5 text-center"
                >
                  <p className="text-3xl font-bold tabular-nums text-[#14532D] sm:text-4xl">
                    {String(item.value).padStart(2, '0')}
                  </p>

                  <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-gray-500 sm:text-sm">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Closing / opening information */}
          <div className="mt-7 text-center">
            <p className="text-sm text-gray-500">
              {isOpen ? 'Application deadline' : isUpcoming ? 'Opening date' : 'Closing date'}
            </p>

            <p className="mt-1 text-lg font-bold text-gray-800">
              {formatDate(
                isUpcoming
                  ? cycle.openingDate
                  : cycle.closingDate
              )}
            </p>

            <p className="mt-2 text-xs text-gray-400">
              East Africa Time (EAT)
            </p>
          </div>

          {/* Status message */}
          {isOpen && (
            <div className="mt-7 rounded-xl bg-green-50 p-4 text-center">
              <p className="font-semibold text-green-800">
                Applications are currently being accepted.
              </p>
              <p className="mt-1 text-sm text-green-700">
                Submit your application before the deadline.
              </p>
            </div>
          )}

          {isUpcoming && (
            <div className="mt-7 rounded-xl bg-amber-50 p-4 text-center">
              <p className="font-semibold text-amber-800">
                Applications have not opened yet.
              </p>
            </div>
          )}

          {status === 'Closed' && (
            <div className="mt-7 rounded-xl bg-gray-100 p-4 text-center">
              <p className="font-semibold text-gray-700">
                The bursary application window is now closed.
              </p>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
