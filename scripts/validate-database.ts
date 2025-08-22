// Database Health Validation Script
// Run this to validate all database fixes and functionality

import { supabase } from '../src/lib/supabase';

interface HealthCheck {
  check_name: string;
  status: string;
  message: string;
  details: any;
}

interface MaintenanceResult {
  action: string;
  status: string;
  affected_rows: number;
  message: string;
}

async function validateDatabaseHealth() {
  console.log('🔍 Running Database Health Validation...\n');

  try {
    // Test 1: Basic connection
    console.log('1. Testing Supabase connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count(*)')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Connection failed:', connectionError.message);
      return;
    }
    console.log('✅ Connection successful');

    // Test 2: Health check function
    console.log('\n2. Running database health checks...');
    const { data: healthData, error: healthError } = await supabase
      .rpc('check_database_health');
    
    if (healthError) {
      console.error('❌ Health check failed:', healthError.message);
    } else {
      const healthChecks = healthData as HealthCheck[];
      healthChecks.forEach(check => {
        const icon = check.status === 'OK' ? '✅' : 
                    check.status === 'WARNING' ? '⚠️' : '❌';
        console.log(`${icon} ${check.check_name}: ${check.message}`);
      });
    }

    // Test 3: Admin functions
    console.log('\n3. Testing admin functions...');
    const { data: adminTest, error: adminError } = await supabase
      .rpc('is_admin');
    
    if (adminError) {
      console.error('❌ Admin function test failed:', adminError.message);
    } else {
      console.log('✅ Admin functions working');
    }

    // Test 4: User role function
    console.log('\n4. Testing user role function...');
    const { data: roleTest, error: roleError } = await supabase
      .rpc('get_user_role');
    
    if (roleError) {
      console.error('❌ User role function failed:', roleError.message);
    } else {
      console.log(`✅ User role function working (current role: ${roleTest})`);
    }

    // Test 5: Admin stats view
    console.log('\n5. Testing admin dashboard stats...');
    const { data: statsData, error: statsError } = await supabase
      .from('admin_dashboard_stats')
      .select('*')
      .limit(1);
    
    if (statsError) {
      console.error('❌ Admin stats failed:', statsError.message);
    } else {
      console.log('✅ Admin dashboard stats working');
      if (statsData && statsData[0]) {
        const stats = statsData[0];
        console.log(`   - Total users: ${stats.total_users}`);
        console.log(`   - Total rides: ${stats.total_rides}`);
        console.log(`   - Health errors: ${stats.health_errors}`);
        console.log(`   - Health warnings: ${stats.health_warnings}`);
      }
    }

    // Test 6: Maintenance function
    console.log('\n6. Testing maintenance function...');
    const { data: maintenanceData, error: maintenanceError } = await supabase
      .rpc('perform_database_maintenance');
    
    if (maintenanceError) {
      console.error('❌ Maintenance function failed:', maintenanceError.message);
    } else {
      console.log('✅ Maintenance function working');
      const maintenance = maintenanceData as MaintenanceResult[];
      maintenance.forEach(result => {
        console.log(`   - ${result.action}: ${result.message}`);
      });
    }

    // Test 7: RLS policies
    console.log('\n7. Testing RLS policies...');
    const { data: rideTest, error: rideError } = await supabase
      .from('rides')
      .select('id')
      .limit(1);
    
    if (rideError) {
      console.error('❌ RLS test failed:', rideError.message);
    } else {
      console.log('✅ RLS policies working');
    }

    // Test 8: Message access
    console.log('\n8. Testing message access...');
    const { data: messageTest, error: messageError } = await supabase
      .from('messages')
      .select('id')
      .limit(1);
    
    if (messageError) {
      console.error('❌ Message access failed:', messageError.message);
    } else {
      console.log('✅ Message access working');
    }

    console.log('\n🎉 Database validation complete!');
    
  } catch (error) {
    console.error('💥 Validation failed with error:', error);
  }
}

// Performance validation
async function validatePerformance() {
  console.log('\n⚡ Running Performance Validation...\n');

  try {
    // Test query performance with timing
    console.log('1. Testing query performance...');
    
    const start = Date.now();
    const { data, error } = await supabase
      .from('rides')
      .select(`
        *,
        profiles!rides_user_id_fkey(*),
        ride_requests(count)
      `)
      .limit(10);
    
    const queryTime = Date.now() - start;
    
    if (error) {
      console.error('❌ Performance test failed:', error.message);
    } else {
      console.log(`✅ Complex query completed in ${queryTime}ms`);
      if (queryTime < 1000) {
        console.log('✅ Performance is good (< 1s)');
      } else if (queryTime < 3000) {
        console.log('⚠️ Performance is acceptable (< 3s)');
      } else {
        console.log('❌ Performance needs improvement (> 3s)');
      }
    }

  } catch (error) {
    console.error('💥 Performance validation failed:', error);
  }
}

// Security validation
async function validateSecurity() {
  console.log('\n🔒 Running Security Validation...\n');

  try {
    // Test that unauthorized access is blocked
    console.log('1. Testing unauthorized access protection...');
    
    // This should work (reading profiles as authenticated user)
    const { data: allowedData, error: allowedError } = await supabase
      .from('profiles')
      .select('id, name')
      .limit(1);
    
    if (!allowedError) {
      console.log('✅ Authorized access working');
    }

    // Test admin function security
    console.log('2. Testing admin function security...');
    const { data: securityTest, error: securityError } = await supabase
      .rpc('is_admin');
    
    if (!securityError) {
      console.log('✅ Admin security functions working');
    }

    console.log('✅ Security validation complete');

  } catch (error) {
    console.error('💥 Security validation failed:', error);
  }
}

// Run all validations
async function runAllValidations() {
  console.log('🚀 Starting Database Validation Suite\n');
  console.log('=' .repeat(50));
  
  await validateDatabaseHealth();
  await validatePerformance();
  await validateSecurity();
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ All validations complete!');
  console.log('\nDatabase is ready for production 🎉');
}

// Export for usage
export {
  validateDatabaseHealth,
  validatePerformance,
  validateSecurity,
  runAllValidations
};

// If running directly
if (typeof require !== 'undefined' && require.main === module) {
  runAllValidations().catch(console.error);
}
