import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  LogOut,
  UserPlus,
  Shield,
  Crown,
  Briefcase,
  Wrench,
  ChevronDown,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { AppUser, UserRole } from '../types';

interface UserMenuProps {
  currentUser: AppUser | null;
  onSignOut: () => void;
  onOpenSwitchUser: () => void;
  onOpenRegister: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  currentUser,
  onSignOut,
  onOpenSwitchUser,
  onOpenRegister,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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

  if (!currentUser) return null;

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return {
          label: 'Owner',
          icon: Crown,
          className: 'bg-amber-100 text-amber-800 border-amber-200',
        };
      case 'manager':
        return {
          label: 'Manager',
          icon: Briefcase,
          className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        };
      case 'technician':
        return {
          label: 'Technician',
          icon: Wrench,
          className: 'bg-blue-100 text-blue-800 border-blue-200',
        };
    }
  };

  const roleInfo = getRoleBadge(currentUser.role);
  const RoleIcon = roleInfo.icon;

  // Initials for avatar
  const initials = currentUser.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-lg border border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50 transition-colors shadow-2xs cursor-pointer active:scale-98"
        aria-label="User Account Menu"
      >
        {/* Avatar circle */}
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center text-white font-bold text-xs shadow-xs"
          style={{ backgroundColor: currentUser.avatarColor || '#18181b' }}
        >
          {initials}
        </div>

        <div className="text-left hidden md:block">
          <div className="text-xs font-bold text-zinc-900 leading-tight truncate max-w-[110px]">
            {currentUser.name}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-medium">
            <RoleIcon className="w-2.5 h-2.5" />
            <span className="capitalize">{currentUser.role}</span>
          </div>
        </div>

        <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-zinc-200 z-50 overflow-hidden animate-fadeIn">
          {/* Header Summary */}
          <div className="p-4 bg-zinc-50 border-b border-zinc-100">
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-xs shrink-0"
                style={{ backgroundColor: currentUser.avatarColor || '#18181b' }}
              >
                {initials}
              </div>
              <div className="overflow-hidden flex-1">
                <h4 className="text-sm font-bold text-zinc-900 truncate">
                  {currentUser.name}
                </h4>
                <p className="text-xs text-zinc-500 truncate font-mono">
                  @{currentUser.username}
                </p>
                <div className="mt-1.5 flex items-center gap-1">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleInfo.className}`}
                  >
                    <RoleIcon className="w-2.5 h-2.5" />
                    <span>{roleInfo.label}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Email & Phone Details */}
            <div className="mt-3 pt-2.5 border-t border-zinc-200/60 space-y-1 text-[11px] text-zinc-600">
              <div className="flex items-center gap-2 truncate">
                <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="truncate">{currentUser.email}</span>
              </div>
              {currentUser.phone && (
                <div className="flex items-center gap-2 truncate">
                  <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>{currentUser.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-[10px] text-zinc-400 pt-0.5">
                <Calendar className="w-3 h-3 text-zinc-400 shrink-0" />
                <span>Joined {currentUser.createdAt || 'Recent'}</span>
              </div>
            </div>
          </div>

          {/* Action List */}
          <div className="p-1.5 space-y-0.5">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenRegister();
              }}
              className="w-full px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer text-left"
            >
              <UserPlus className="w-4 h-4 text-zinc-500" />
              <span>Register New Technician / Staff</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenSwitchUser();
              }}
              className="w-full px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer text-left"
            >
              <User className="w-4 h-4 text-zinc-500" />
              <span>Switch User Account</span>
            </button>

            <div className="my-1 border-t border-zinc-100" />

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onSignOut();
              }}
              className="w-full px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer text-left"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <span>Sign Out & Lock Screen</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
