import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { User, ChevronDown, Search, Check, Loader2, Users } from 'lucide-react';
import { UserLoginListItem, fetchLoginUsers } from '@/services/authApi';

interface UserComboboxProps {
  selectedUsername: string;
  onSelectUser: (username: string, user?: UserLoginListItem) => void;
}

export const UserCombobox: React.FC<UserComboboxProps> = ({
  selectedUsername,
  onSelectUser,
}) => {
  const [users, setUsers] = useState<UserLoginListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Load users on mount
  useEffect(() => {
    let mounted = true;
    fetchLoginUsers().then((list) => {
      if (mounted) {
        setUsers(list);
        setIsLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  // Calculate dropdown position from trigger button
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + window.scrollY + 6,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  }, []);

  // Open / close
  const handleToggle = () => {
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
      setTimeout(() => searchRef.current?.focus(), 30);
    } else {
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !dropdownRef.current?.contains(target)
      ) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [isOpen]);

  // Reposition on scroll / resize
  useEffect(() => {
    if (!isOpen) return;
    const update = () => updatePosition();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [isOpen, updatePosition]);

  const selectedUser = users.find((u) => u.Username === selectedUsername);
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.FullName.toLowerCase().includes(q) ||
      u.Username.toLowerCase().includes(q) ||
      (u.RoleName?.toLowerCase().includes(q) ?? false)
    );
  });

  const handleSelect = (user: UserLoginListItem) => {
    onSelectUser(user.Username, user);
    setIsOpen(false);
    setSearchQuery('');
  };

  const dropdownPortal = isOpen
    ? createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: dropdownPos.width,
            zIndex: 99999,
            backgroundColor: '#ffffff',
            borderRadius: 16,
            border: '1px solid #E2E8F0',
            boxShadow: '0 12px 40px rgba(15, 23, 42, 0.12)',
            padding: 8,
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            overflow: 'hidden',
          }}
        >
          {/* Search Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10, padding: '6px 12px', marginBottom: 6 }}>
            <Search size={15} color="#64748b" style={{ flexShrink: 0 }} />
            <input
              ref={searchRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or role..."
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                fontSize: 13,
                color: '#0F172A',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* User List */}
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {isLoading ? (
              // Skeleton
              [1, 2, 3].map((i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#E2E8F0', flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ height: 12, backgroundColor: '#E2E8F0', borderRadius: 4, width: '65%' }} />
                    <div style={{ height: 10, backgroundColor: '#E2E8F0', borderRadius: 4, width: '40%' }} />
                  </div>
                </div>
              ))
            ) : filteredUsers.length === 0 ? (
              <div style={{ padding: '20px 12px', textAlign: 'center' }}>
                <Users size={28} color="#CBD5E1" style={{ margin: '0 auto 8px' }} />
                <p style={{ fontSize: 13, color: '#64748b', margin: 0, fontWeight: 500 }}>No active users found</p>
              </div>
            ) : (
              filteredUsers.map((item) => {
                const isSelected = item.Username === selectedUsername;
                return (
                  <button
                    key={item.UserID}
                    onClick={() => handleSelect(item)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      width: '100%',
                      padding: '9px 10px',
                      borderRadius: 10,
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#EFF6FF' : 'transparent',
                      textAlign: 'left',
                      transition: 'background-color 120ms ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F1F5F9';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = isSelected ? '#EFF6FF' : 'transparent';
                    }}
                  >
                    {/* Avatar */}
                    <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: isSelected ? '#BFDBFE' : '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#2563EB' }}>
                        {item.FullName.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: isSelected ? '#2563EB' : '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.FullName}
                      </p>
                      {item.RoleName && (
                        <p style={{ margin: 0, fontSize: 11, color: '#64748B', marginTop: 1 }}>
                          {item.RoleName}
                        </p>
                      )}
                    </div>

                    {/* Checkmark */}
                    {isSelected && <Check size={15} color="#2563eb" style={{ flexShrink: 0 }} />}
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
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        onClick={handleToggle}
        type="button"
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          height: 52,
          borderRadius: 14,
          border: isOpen ? '1px solid #2563EB' : '1px solid #E5E7EB',
          backgroundColor: '#FFFFFF',
          paddingLeft: 16,
          paddingRight: 16,
          gap: 12,
          cursor: 'pointer',
          outline: 'none',
          boxShadow: isOpen ? '0 0 0 3px rgba(37, 99, 235, 0.1)' : 'none',
          transition: 'border-color 150ms, box-shadow 150ms',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        }}
      >
        <User size={18} color={isOpen ? '#2563eb' : '#9ca3af'} style={{ flexShrink: 0 }} />

        <span style={{ flex: 1, textAlign: 'left' }}>
          {isLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Loader2 size={15} color="#2563eb" />
              <span style={{ fontSize: 14, color: '#64748b', fontStyle: 'italic' }}>Loading user directory...</span>
            </span>
          ) : selectedUser ? (
            <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{selectedUser.FullName}</span>
          ) : (
            <span style={{ fontSize: 15, color: '#9ca3af' }}>Select your account</span>
          )}
        </span>

        <ChevronDown
          size={18}
          color="#9ca3af"
          style={{
            flexShrink: 0,
            transition: 'transform 200ms ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {/* Portal Dropdown renders directly on document.body — no overflow clipping */}
      {dropdownPortal}
    </>
  );
};
