import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, Check, ChevronDown, Users, User } from 'lucide-react';

export interface CouncilorItem {
  CouncilorID: number;
  FullName: string;
}

interface CouncilorComboboxProps {
  councilors: CouncilorItem[];
  selectedID: number | null;
  onSelect: (id: number, name: string) => void;
  placeholder?: string;
}

export const CouncilorCombobox: React.FC<CouncilorComboboxProps> = ({
  councilors,
  selectedID,
  onSelect,
  placeholder = 'Search Councilor...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedCouncilor = councilors.find((c) => c.CouncilorID === selectedID);

  const filtered = councilors.filter((c) =>
    c.FullName.toLowerCase().includes(search.toLowerCase())
  );

  const updatePos = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      updatePos();
      setIsOpen(true);
      setTimeout(() => searchRef.current?.focus(), 30);
    } else {
      setIsOpen(false);
      setSearch('');
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!triggerRef.current?.contains(t) && !dropdownRef.current?.contains(t)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const upd = () => updatePos();
    window.addEventListener('scroll', upd, true);
    window.addEventListener('resize', upd);
    return () => {
      window.removeEventListener('scroll', upd, true);
      window.removeEventListener('resize', upd);
    };
  }, [isOpen, updatePos]);

  const portal = isOpen
    ? createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: dropdownPos.width,
            zIndex: 99999,
            backgroundColor: '#FFFFFF',
            borderRadius: 14,
            border: '1px solid #E2E8F0',
            boxShadow: '0 16px 48px rgba(15, 23, 42, 0.12)',
            padding: 8,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '8px 12px', marginBottom: 6 }}>
            <Search size={14} color="#64748B" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name..."
              style={{ flex: 1, border: 'none', outline: 'none', backgroundColor: 'transparent', fontSize: 13, color: '#0F172A', fontFamily: 'inherit' }}
            />
          </div>

          {/* List */}
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '16px 12px', textAlign: 'center' }}>
                <Users size={24} color="#CBD5E1" style={{ margin: '0 auto 6px' }} />
                <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>No councilor found</p>
              </div>
            ) : (
              filtered.map((c) => {
                const selected = c.CouncilorID === selectedID;
                return (
                  <button
                    key={c.CouncilorID}
                    onClick={() => { onSelect(c.CouncilorID, c.FullName); setIsOpen(false); setSearch(''); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 10px', borderRadius: 10, border: 'none', cursor: 'pointer', backgroundColor: selected ? '#EFF6FF' : 'transparent', textAlign: 'left' }}
                    onMouseEnter={(e) => { if (!selected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F1F5F9'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = selected ? '#EFF6FF' : 'transparent'; }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: selected ? '#BFDBFE' : '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#2563EB' }}>{c.FullName.charAt(0)}</span>
                    </div>
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: selected ? '#2563EB' : '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.FullName}
                    </span>
                    {selected && <Check size={14} color="#2563EB" />}
                  </button>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <button
        ref={triggerRef}
        onClick={handleToggle}
        type="button"
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          height: 46,
          borderRadius: 12,
          border: isOpen ? '1.5px solid #2563EB' : '1px solid #CBD5E1',
          backgroundColor: '#FFFFFF',
          paddingLeft: 14,
          paddingRight: 14,
          gap: 10,
          cursor: 'pointer',
          outline: 'none',
          boxShadow: isOpen ? '0 0 0 3px rgba(37, 99, 235, 0.1)' : 'none',
          fontFamily: 'Inter, system-ui, sans-serif',
          transition: 'border-color 150ms, box-shadow 150ms',
        }}
      >
        <User size={16} color={isOpen ? '#2563EB' : '#9CA3AF'} />
        <span style={{ flex: 1, textAlign: 'left', fontSize: 14, color: selectedCouncilor ? '#0F172A' : '#9CA3AF', fontWeight: selectedCouncilor ? 500 : 400 }}>
          {selectedCouncilor ? selectedCouncilor.FullName : placeholder}
        </span>
        <ChevronDown size={16} color="#94A3B8" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 180ms ease' }} />
      </button>
      {portal}
    </>
  );
};
