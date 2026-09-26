// Тестовый скрипт для проверки сервера
import http from 'http';

const testServer = () => {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3001/api/health', (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Сервер работает!');
          console.log('Ответ:', data);
          resolve(data);
        } else {
          console.log(`⚠️ Сервер ответил со статусом ${res.statusCode}`);
          resolve(data);
        }
      });
    });

    req.on('error', (err) => {
      console.log('❌ Сервер не отвечает');
      console.log('Ошибка:', err.message);
      reject(err);
    });

    req.setTimeout(3000, () => {
      req.destroy();
      reject(new Error('Таймаут подключения'));
    });
  });
};

testServer()
  .then(() => process.exit(0))
  .catch((err) => {
    console.log('\n💡 Возможные причины:');
    console.log('   1. Сервер не запущен');
    console.log('   2. Порт 3001 занят');
    console.log('   3. Проблемы с сетью');
    process.exit(1);
  });

