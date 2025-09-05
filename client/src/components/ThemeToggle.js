import React from 'react';

const ThemeToggle = ({ theme, toggle }) => {
  const isDark = theme === 'dark';
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="relative inline-flex h-9 w-18 items-center rounded-full focus:outline-none shadow-soft border border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-800 overflow-hidden"
    >
      {/* Scenic background swaps with theme */}
      <div className={`absolute inset-0 transition-opacity duration-300 ${isDark ? 'opacity-100' : 'opacity-100'}`}>
        <div
          className="h-full w-full bg-cover bg-center"
          style={{
            backgroundImage: isDark
              ? 'url(https://i.imgur.com/2v8G3Jm.png)'
              : 'url(https://i.imgur.com/srj7i7t.png)'
          }}
        />
      </div>
      {/* Knob */}
      <div
        className={`absolute h-8 w-8 rounded-full shadow-md transform transition-transform duration-300 ${
          isDark ? 'translate-x-9 bg-purple-400' : 'translate-x-1 bg-yellow-400'
        }`}
      />
    </button>
  );
};

export default ThemeToggle;


