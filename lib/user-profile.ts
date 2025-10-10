import { supabase } from './supabase';

export class UserProfileService {
  /**
   * Get user profile by user ID
   */
  static async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }

    return data;
  }

  /**
   * Create or update user profile
   */
  static async upsertProfile(userId: string, profileData: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        ...profileData,
        updated_at: new Date().toISOString(),
        last_activity: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting profile:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update specific field in user profile
   */
  static async updateField(userId: string, field: string, value: unknown) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ 
        [field]: value,
        updated_at: new Date().toISOString(),
        last_activity: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile field:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get user's usage statistics
   */
  static async getUsageStats(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('free_appeals_used, paid_appeals_used, total_appeals_created, last_free_appeal_reset, vehicle_registration')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching usage stats:', error);
      throw error;
    }

    // Check if user has free appeal available
    const now = new Date();
    const lastReset = new Date(data.last_free_appeal_reset);
    const hasFreeAppeal = data.free_appeals_used === 0 || 
      (now.getTime() - lastReset.getTime()) > (30 * 24 * 60 * 60 * 1000); // 30 days

    return {
      ...data,
      hasFreeAppeal,
      vehicleReg: data.vehicle_registration
    };
  }

  /**
   * Increment appeal usage
   */
  static async incrementAppealUsage(userId: string, isFreeAppeal: boolean = true) {
    const field = isFreeAppeal ? 'free_appeals_used' : 'paid_appeals_used';
    const totalField = 'total_appeals_created';

    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        [field]: supabase.raw(`${field} + 1`),
        [totalField]: supabase.raw(`${totalField} + 1`),
        updated_at: new Date().toISOString(),
        last_activity: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error incrementing appeal usage:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update vehicle registration
   */
  static async updateVehicle(userId: string, vehicleReg: string) {
    return this.updateField(userId, 'vehicle_registration', vehicleReg);
  }

  /**
   * Update Stripe customer ID
   */
  static async updateStripeCustomerId(userId: string, stripeCustomerId: string) {
    return this.updateField(userId, 'stripe_customer_id', stripeCustomerId);
  }

  /**
   * Get user's name for chat context
   */
  static async getUserName(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('first_name, last_name, email')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user name:', error);
      return null;
    }

    if (data.first_name && data.last_name) {
      return `${data.first_name} ${data.last_name}`;
    }
    
    return data.email || 'User';
  }
}
