import { useState, useEffect, useRef } from 'react';
import { useI18n } from '../../contexts/i18nContext';

type Language = 'en' | 'fr' | 'de' | 'he';

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'fr', label: 'FR' },
  { code: 'en', label: 'EN' },
  { code: 'de', label: 'DE' },
  { code: 'he', label: 'HE' },
];

export function LanguageSelector() {
  const { language, setLanguage } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  return (
    <div ref={selectorRef} style={{
      position: 'fixed',
      bottom: '20px',
      insetInlineEnd: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column-reverse',
      alignItems: 'flex-end',
      gap: '8px',
    }}>
      {/* Current language button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '8px 16px',
          borderRadius: '12px',
          color: 'rgba(255, 255, 255, 0.8)',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          fontSize: '14px',
          fontWeight: 500,
          outline: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
          e.currentTarget.style.color = 'white';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
        }}
      >
        <span style={{ fontSize: '13px', letterSpacing: '1px' }}>{currentLang.label}</span>
      </button>

      {/* Collapse Menu */}
      {isOpen && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(15px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '8px',
          gap: '4px',
          animation: 'slideUpLang 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards',
          transformOrigin: 'bottom',
        }}>
          {LANGUAGES.filter(l => l.code !== currentLang.code).map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '14px',
                textAlign: 'start',
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
              }}
            >
              <span style={{ fontSize: '13px', letterSpacing: '1px' }}>{lang.label}</span>
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes slideUpLang {
          from { opacity: 0; transform: translateY(10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
