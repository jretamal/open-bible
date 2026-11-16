import { useMemo, useState } from 'react';
import { BookBookmark, CaretDown, CaretRight, MagnifyingGlass } from '@phosphor-icons/react';
import { Sheet } from './Sheet';
import { SearchField } from './SearchField';
import { Empty } from './Empty';
import { Chip } from './Chip';
import { CONCORDANCE_CATEGORIES, searchTerms, type ConcordanceTerm } from '../data/concordance';
import { useBookName } from '../hooks';
import { useStudy } from '../state/study';
import { useUI } from '../state/ui';
import { refLabel } from '../ref';
import { go } from '../router';
import { useT } from '../i18n';

export function ConcordanceSheet() {
  const t = useT();
  const close = useUI((s) => s.close);
  const goTo = useStudy((s) => s.goTo);
  const bookName = useBookName();

  const [q, setQ] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);

  const isSearching = q.trim().length > 0;

  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    return searchTerms(q);
  }, [q, isSearching]);

  const categoriesToShow = useMemo(() => {
    if (selectedCat === 'all') return CONCORDANCE_CATEGORIES;
    return CONCORDANCE_CATEGORIES.filter((c) => c.id === selectedCat);
  }, [selectedCat]);

  const toggleTerm = (term: string) => {
    setExpandedTerm((prev) => (prev === term ? null : term));
  };

  const handleSelectVerse = (book: string, chapter: number, verse: number) => {
    scrollTo(0, 0);
    goTo(book, chapter, verse);
    close();
    go('/');
  };

  return (
    <Sheet
      title={t('concordance') || 'Concordancia temática'}
      icon={BookBookmark}
      onClose={close}
      tall
      pinned={
        <div style={{ display: 'grid', gap: 10 }}>
          <SearchField
            value={q}
            onChange={setQ}
            placeholder={t('searchTopics') || 'Buscar tema (ej. refugio, gracia)...'}
            aria-label="Buscar tema bíblico"
            autoFocus={false}
          />
          {!isSearching && (
            <div
              style={{
                display: 'flex',
                gap: 6,
                overflowX: 'auto',
                paddingBottom: 4,
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              <button
                className="chip-btn"
                aria-pressed={selectedCat === 'all'}
                onClick={() => setSelectedCat('all')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 999,
                  border: '1px solid var(--line)',
                  background: selectedCat === 'all' ? 'var(--accent)' : 'var(--surface)',
                  color: selectedCat === 'all' ? 'var(--accent-fg)' : 'var(--fg)',
                  fontSize: 13,
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                }}
              >
                Todos
              </button>
              {CONCORDANCE_CATEGORIES.map((cat) => {
                const active = selectedCat === cat.id;
                return (
                  <button
                    key={cat.id}
                    className="chip-btn"
                    aria-pressed={active}
                    onClick={() => setSelectedCat(cat.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 999,
                      border: '1px solid var(--line)',
                      background: active ? 'var(--accent)' : 'var(--surface)',
                      color: active ? 'var(--accent-fg)' : 'var(--fg)',
                      fontSize: 13,
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                    }}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      }
    >
      {isSearching ? (
        searchResults.length === 0 ? (
          <Empty compact icon={MagnifyingGlass} hint="Prueba con otra palabra clave">
            No se encontraron temas para &ldquo;{q}&rdquo;
          </Empty>
        ) : (
          <div style={{ display: 'grid', gap: 8, paddingBottom: 24 }}>
            {searchResults.map(({ category, term }) => (
              <TermCard
                key={`${category.id}-${term.term}`}
                term={term}
                categoryName={category.name}
                expanded={expandedTerm === term.term || searchResults.length === 1}
                onToggle={() => toggleTerm(term.term)}
                onSelectVerse={handleSelectVerse}
                bookName={bookName}
              />
            ))}
          </div>
        )
      ) : (
        <div style={{ display: 'grid', gap: 18, paddingBottom: 24 }}>
          {categoriesToShow.map((cat) => (
            <section key={cat.id} style={{ display: 'grid', gap: 8 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--muted)',
                  padding: '4px 4px 0',
                }}
              >
                {cat.name}
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                {cat.terms.map((term) => (
                  <TermCard
                    key={term.term}
                    term={term}
                    expanded={expandedTerm === term.term}
                    onToggle={() => toggleTerm(term.term)}
                    onSelectVerse={handleSelectVerse}
                    bookName={bookName}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </Sheet>
  );
}

interface TermCardProps {
  term: ConcordanceTerm;
  categoryName?: string;
  expanded: boolean;
  onToggle: () => void;
  onSelectVerse: (book: string, chapter: number, verse: number) => void;
  bookName: (bookId: string) => string;
}

function TermCard({ term, categoryName, expanded, onToggle, onSelectVerse, bookName }: TermCardProps) {
  return (
    <div
      style={{
        borderRadius: 'var(--radius)',
        border: '1px solid var(--line)',
        background: 'var(--surface)',
        overflow: 'hidden',
        transition: 'background 0.15s ease',
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          background: 'transparent',
          border: 'none',
          color: 'var(--fg)',
          textAlign: 'left',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '0.02em' }}>{term.term}</span>
          <Chip>{term.entries.length} pasajes</Chip>
          {categoryName && (
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>• {categoryName}</span>
          )}
        </div>
        {expanded ? <CaretDown size={18} weight="bold" color="var(--muted)" /> : <CaretRight size={18} weight="bold" color="var(--muted)" />}
      </button>

      {expanded && (
        <div
          style={{
            borderTop: '1px solid var(--line)',
            background: 'var(--bg)',
            padding: '6px 0',
          }}
        >
          {term.entries.map((entry, idx) => {
            const label = refLabel(bookName(entry.book), entry.chapter, entry.verse);
            return (
              <button
                key={idx}
                onClick={() => onSelectVerse(entry.book, entry.chapter, entry.verse)}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  padding: '9px 14px',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: idx < term.entries.length - 1 ? '1px dashed var(--line)' : 'none',
                }}
              >
                <span
                  style={{
                    fontSize: 13.5,
                    color: 'var(--fg)',
                    fontFamily: 'var(--font-serif)',
                    lineHeight: 1.4,
                    paddingRight: 12,
                  }}
                >
                  &ldquo;{entry.snippet}&rdquo;
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--accent)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    fontFamily: 'var(--font-ui)',
                  }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
