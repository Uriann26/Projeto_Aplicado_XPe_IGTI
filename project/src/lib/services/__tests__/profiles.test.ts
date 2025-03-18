import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../../supabase';
import { getProfile, updateProfile, updateUserRole, getAllProfiles } from '../profiles';
import type { Profile } from '../../types';

// Mock Supabase client
vi.mock('../../supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      order: vi.fn().mockResolvedValue({ data: [], error: null })
    }))
  }
}));

describe('Profile Service', () => {
  const mockProfile: Profile = {
    id: '123',
    name: 'Test User',
    role: 'engineer',
    updated_at: new Date().toISOString()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getProfile fetches profile by user ID', async () => {
    const mockSupabase = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
    };
    vi.mocked(supabase.from).mockReturnValue(mockSupabase as any);

    const result = await getProfile('123');
    expect(result).toEqual(mockProfile);
    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(mockSupabase.select).toHaveBeenCalled();
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', '123');
  });

  it('updateProfile updates user profile', async () => {
    const mockData = { name: 'Updated Name' };
    const mockSupabase = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null })
    };
    vi.mocked(supabase.from).mockReturnValue(mockSupabase as any);

    await updateProfile('123', mockData);
    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(mockSupabase.update).toHaveBeenCalledWith(expect.objectContaining(mockData));
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', '123');
  });

  it('updateUserRole updates user role', async () => {
    const mockSupabase = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null })
    };
    vi.mocked(supabase.from).mockReturnValue(mockSupabase as any);

    await updateUserRole('123', 'supervisor');
    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(mockSupabase.update).toHaveBeenCalledWith({ role: 'supervisor' });
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', '123');
  });

  it('getAllProfiles fetches all profiles', async () => {
    const mockProfiles = [
      { id: '123', name: 'User 1', role: 'engineer', updated_at: new Date().toISOString() },
      { id: '456', name: 'User 2', role: 'supervisor', updated_at: new Date().toISOString() }
    ];
    const mockSupabase = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockProfiles, error: null })
    };
    vi.mocked(supabase.from).mockReturnValue(mockSupabase as any);

    const result = await getAllProfiles();
    expect(result).toEqual(mockProfiles);
    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(mockSupabase.select).toHaveBeenCalled();
    expect(mockSupabase.order).toHaveBeenCalledWith('name');
  });

  it('handles errors appropriately', async () => {
    const mockError = new Error('Test error');
    const mockSupabase = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: mockError })
    };
    vi.mocked(supabase.from).mockReturnValue(mockSupabase as any);

    await expect(getProfile('123')).rejects.toThrow('Test error');
    expect(supabase.from).toHaveBeenCalledWith('profiles');
  });
});