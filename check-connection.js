#!/usr/bin/env node

/**
 * Script para verificar la conexión entre frontend y backend
 * 
 * Uso:
 *   node check-connection.js
 *   node check-connection.js https://tu-backend.railway.app
 */

const apiUrl = process.argv[2] || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

console.log(`\n🔍 Verificando conexión al backend: ${apiUrl}\n`);

async function checkHealth() {
  try {
    const response = await fetch(`${apiUrl}/health`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('✅ Backend respondiendo correctamente');
    console.log(`   - Status: ${data.status}`);
    console.log(`   - Database: ${data.database}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con el backend:');
    console.error(`   ${error.message}`);
    
    console.log('\n💡 Posibles causas:');
    console.log('   - El backend no está corriendo');
    console.log('   - La URL del backend es incorrecta');
    console.log('   - Hay un problema de CORS');
    console.log('   - El firewall está bloqueando la conexión');
    
    return false;
  }
}

async function checkCORS() {
  console.log('\n🔐 Verificando CORS...');
  
  try {
    const response = await fetch(`${apiUrl}/`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET'
      }
    });
    
    const corsHeader = response.headers.get('access-control-allow-origin');
    
    if (corsHeader) {
      console.log('✅ CORS configurado correctamente');
      console.log(`   - Allow-Origin: ${corsHeader}`);
    } else {
      console.log('⚠️  CORS puede no estar configurado correctamente');
    }
  } catch (error) {
    console.log('⚠️  No se pudo verificar CORS');
  }
}

async function checkAPI() {
  console.log('\n📡 Verificando endpoints de la API...');
  
  const endpoints = [
    { path: '/', name: 'Root' },
    { path: '/docs', name: 'Documentación' },
    { path: '/health', name: 'Health Check' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${apiUrl}${endpoint.path}`);
      const status = response.ok ? '✅' : '⚠️';
      console.log(`   ${status} ${endpoint.name}: ${response.status}`);
    } catch (error) {
      console.log(`   ❌ ${endpoint.name}: Error`);
    }
  }
}

async function main() {
  const healthOk = await checkHealth();
  
  if (healthOk) {
    await checkCORS();
    await checkAPI();
    
    console.log('\n✅ Todo parece estar funcionando correctamente!');
    console.log(`\n📚 Documentación API: ${apiUrl}/docs`);
  } else {
    process.exit(1);
  }
}

main();
