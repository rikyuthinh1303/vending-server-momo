// ===== ĐỔI DÒNG NÀY THÀNH SỐ MOMO THẬT CỦA BẠN =====
const MOMO_PHONE = "0901234567";   // ← SỐ MOMO CỦA BẠN Ở ĐÂY (10 hoặc 11 số)
// ===================================================

const express = require('express');
const mqtt = require('mqtt');
const app = express();
app.use(express.json());

const mqttClient = mqtt.connect('mqtt://broker.emqx.io');
const pendingOrders = {};

// API cho app Flutter
app.post('/pay', (req, res) => {
  const { machineId, slot, amount } = req.body;
  const orderId = `${machineId}_${slot}_${Date.now()}`;

  const payUrl = `https://nhantien.momo.vn/${MOMO_PHONE}/${amount}?orderId=${orderId}&requestId=${orderId}&extraData=Vending`;

  pendingOrders[orderId] = { machineId, slot };
  res.json({ payUrl });
});

// Webhook MoMo
app.post('/momo-webhook', (req, res) => {
  if (req.body.resultCode == 0) {
    const orderId = req.body.orderId;
    const order = pendingOrders[orderId];
    if (order) {
      mqttClient.publish(`vending/${order.machineId}/cmd`, order.slot.toString());
      delete pendingOrders[orderId];
    }
  }
  res.sendStatus(200);
});

app.get('/', (req, res) => res.send('Smart Vending Server đang chạy OK!'));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Server chạy port', port));
