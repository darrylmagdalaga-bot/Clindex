import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';
import { User, ChevronDown, Search, Check, Loader2 } from 'lucide-react';
import { UserLoginListItem, fetchLoginUsers } from '@/services/authApi';

interface UserComboboxProps {
  selectedUsername: string;
  onSelectUser: (username: string, user?: UserLoginListItem) => void;
  isFocused?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const UserCombobox: React.FC<UserComboboxProps> = ({
  selectedUsername,
  onSelectUser,
  isFocused = false,
  onFocus,
  onBlur,
}) => {
  const [users, setUsers] = useState<UserLoginListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const containerRef = useRef<View>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadUsers() {
      setIsLoading(true);
      const userList = await fetchLoginUsers();
      if (isMounted) {
        setUsers(userList);
        setIsLoading(false);
      }
    }
    loadUsers();
    return () => {
      isMounted = false;
    };
  }, []);

  const selectedUser = users.find((u) => u.Username === selectedUsername);

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.FullName.toLowerCase().includes(q) ||
      u.Username.toLowerCase().includes(q) ||
      (u.RoleName && u.RoleName.toLowerCase().includes(q))
    );
  });

  const handleSelect = (user: UserLoginListItem) => {
    onSelectUser(user.Username, user);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <View style={styles.container} ref={containerRef}>
      {/* Combobox Trigger Button */}
      <Pressable
        onPress={() => {
          setIsOpen(!isOpen);
          if (!isOpen) onFocus?.();
          else onBlur?.();
        }}
        style={[
          styles.triggerWrapper,
          (isFocused || isOpen) && styles.triggerWrapperFocused,
        ]}
      >
        <User size={18} color={isFocused || isOpen ? '#2563eb' : '#9ca3af'} style={styles.inputIcon} />
        
        <View style={styles.triggerTextContainer}>
          {isLoading ? (
            <View style={styles.loadingSkeletonRow}>
              <Loader2 size={16} color="#2563eb" style={{ marginRight: 6 }} />
              <Text style={styles.skeletonText}>Loading user directory...</Text>
            </View>
          ) : selectedUser ? (
            <Text style={styles.selectedNameText}>{selectedUser.FullName}</Text>
          ) : (
            <Text style={styles.placeholderText}>Select your account</Text>
          )}
        </View>

        <ChevronDown
          size={18}
          color="#9ca3af"
          style={{
            transform: [{ rotate: isOpen ? '180deg' : '0deg' }],
          }}
        />
      </Pressable>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <View style={styles.dropdownPopover}>
          {/* Search Bar inside Popover */}
          <View style={styles.searchBarContainer}>
            <Search size={16} color="#64748b" style={styles.searchIcon} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by name or role..."
              placeholderTextColor="#9ca3af"
              style={styles.searchInput}
              autoFocus
            />
          </View>

          {/* User List / Skeleton / Empty State */}
          <ScrollView style={styles.userListScroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {isLoading ? (
              <View style={styles.skeletonContainer}>
                {[1, 2, 3].map((i) => (
                  <View key={i} style={styles.skeletonItem}>
                    <View style={styles.skeletonAvatar} />
                    <View style={styles.skeletonLines}>
                      <View style={[styles.skeletonLine, { width: '70%' }]} />
                      <View style={[styles.skeletonLine, { width: '40%', height: 10 }]} />
                    </View>
                  </View>
                ))}
              </View>
            ) : filteredUsers.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateText}>No active users found</Text>
              </View>
            ) : (
              filteredUsers.map((item) => {
                const isSelected = item.Username === selectedUsername;
                return (
                  <Pressable
                    key={item.UserID}
                    onPress={() => handleSelect(item)}
                    style={({ pressed }) => [
                      styles.userOptionItem,
                      isSelected && styles.userOptionItemSelected,
                      pressed && styles.userOptionItemPressed,
                    ]}
                  >
                    <View style={styles.userAvatarBox}>
                      <Text style={styles.userAvatarInitial}>
                        {item.FullName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    
                    <View style={styles.userInfoCol}>
                      <Text style={[styles.userOptionName, isSelected && styles.userOptionNameSelected]}>
                        {item.FullName}
                      </Text>
                      {item.RoleName && (
                        <Text style={styles.userOptionRole}>{item.RoleName}</Text>
                      )}
                    </View>

                    {isSelected && <Check size={16} color="#2563eb" />}
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 100,
  },
  triggerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
  },
  triggerWrapperFocused: {
    borderColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  inputIcon: {
    marginRight: 12,
  },
  triggerTextContainer: {
    flex: 1,
  },
  selectedNameText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  placeholderText: {
    fontSize: 15,
    color: '#9ca3af',
  },
  loadingSkeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonText: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
  },
  dropdownPopover: {
    position: 'absolute',
    top: 58,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 12,
    zIndex: 999,
    padding: 8,
    maxHeight: 280,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 38,
    marginBottom: 6,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    outlineStyle: 'none' as any,
  },
  userListScroll: {
    maxHeight: 210,
  },
  skeletonContainer: {
    padding: 8,
    gap: 12,
  },
  skeletonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  skeletonAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
  skeletonLines: {
    flex: 1,
    gap: 6,
  },
  skeletonLine: {
    height: 12,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
  },
  emptyStateContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  userOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    gap: 10,
  },
  userOptionItemSelected: {
    backgroundColor: '#EFF6FF',
  },
  userOptionItemPressed: {
    backgroundColor: '#F1F5F9',
  },
  userAvatarBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarInitial: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
  },
  userInfoCol: {
    flex: 1,
  },
  userOptionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  userOptionNameSelected: {
    color: '#2563EB',
  },
  userOptionRole: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
});
