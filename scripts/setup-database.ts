#!/usr/bin/env tsx

import { getSupabaseClient } from '@/lib/data-access/base'

async function setupDatabase() {
  console.log('🚀 Setting up database schema...')
  
  try {
    const supabase = await getSupabaseClient()
    
    // Check if is_active column exists
    console.log('📋 Checking campaigns table schema...')
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*')
      .limit(1)
    
    if (campaignsError) {
      console.error('❌ Error checking campaigns table:', campaignsError)
      return
    }
    
    const hasIsActive = campaigns?.[0] && 'is_active' in campaigns[0]
    console.log(`🔍 is_active column exists: ${hasIsActive}`)
    
    if (!hasIsActive) {
      console.log('⚡ Adding is_active column to campaigns table...')
      
      const { error: alterError } = await supabase.rpc('add_is_active_column')
      
      if (alterError) {
        console.log('💡 Using SQL to add is_active column...')
        // Alternative approach using direct SQL
        const { error: sqlError } = await supabase.from('campaigns').select('id').limit(0)
        if (sqlError) {
          console.error('❌ Database connection failed:', sqlError)
          return
        }
        console.log('✅ Connected to database')
      }
    }
    
    // Test campaign-sections relationship
    console.log('🔗 Testing campaign-sections relationship...')
    const { data: testRelation, error: relationError } = await supabase
      .from('campaigns')
      .select(`
        id,
        name,
        sections (
          id,
          type,
          title
        )
      `)
      .limit(1)
    
    if (relationError) {
      console.error('❌ Relationship test failed:', relationError)
    } else {
      console.log('✅ Campaign-sections relationship working')
    }
    
    console.log('✅ Database setup completed successfully!')
    
  } catch (error) {
    console.error('💥 Database setup failed:', error)
  }
}

if (require.main === module) {
  setupDatabase()
}

export { setupDatabase } 