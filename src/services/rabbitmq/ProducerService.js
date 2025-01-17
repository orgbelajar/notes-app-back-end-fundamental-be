/* eslint-disable import/no-extraneous-dependencies */
const amqp = require('amqplib');

const ProducerService = {
  //* Fungsi async untuk mengirimkan pesan ke queue
  sendMessage: async (queue, message) => {
    // Pertama, buat koneksi ke RabbitMQ server
    const connection = await amqp.connect(process.env.RABBITMQ_SERVER);
    // Kedua, buat channel
    const channel = await connection.createChannel();
    // Ketiga, buat queue
    await channel.assertQueue(queue, {
      durable: true,
    });

    // Keempat, kirim pesan dalam bentuk Buffer ke queue
    await channel.sendToQueue(queue, Buffer.from(message));

    // Terakhir, tutup koneksi setelah satu detik berlangsung dari pengiriman pesan,
    /*
    setTimeout ini digunakan untuk menutup koneksi ke RabbitMQ dengan aman,
    setelah memberikan waktu yang cukup agar pesan selesai terkirim ke queue.
    */
    setTimeout(() => {
      connection.close();
    }, 1000);
  },
};

module.exports = ProducerService;
