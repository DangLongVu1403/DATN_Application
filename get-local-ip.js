const fs = require('fs');
const os = require('os');

function getWifiIpAddress() {
  const interfaces = os.networkInterfaces();
  const wifiNames = ['Wi-Fi', 'wlan0', 'en0']; // thêm tên khác nếu cần

  for (const name of wifiNames) {
    const ifaceList = interfaces[name];
    if (ifaceList) {
      for (const iface of ifaceList) {
        if (iface.family === 'IPv4' && !iface.internal) {
          console.log(`Địa chỉ IP Wi-Fi: ${iface.address}`); // In địa chỉ IP ra console
          return iface.address;
        }
      }
    }
  }

  return '127.0.0.1'; // fallback nếu không có Wi-Fi
}

// Lấy địa chỉ IP
const ip = getWifiIpAddress();
const port = 4500; 

// Tạo nội dung cho file .env
const envContent = `IP_ADDRESS=${ip}\nPORT=${port}\n`;

// Ghi vào file .env
fs.writeFileSync('.env', envContent);