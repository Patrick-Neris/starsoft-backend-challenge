import amqp, { Channel, Connection } from 'amqplib';

export const RabbitMQProvider = {
  provide: 'RABBITMQ_CHANNEL',
  useFactory: async (): Promise<Channel> => {
    const connection: Connection = await amqp.connect({
      hostname: process.env.RABBITMQ_HOST,
      port: Number(process.env.RABBITMQ_PORT),
      username: process.env.RABBITMQ_USER,
      password: process.env.RABBITMQ_PASS,
    });

    const channel: Channel = await connection.createChannel();

    await channel.assertExchange('reservas.exchange', 'fanout', {
      durable: true,
    });

    await channel.assertExchange('vendas.exchange', 'fanout', {
      durable: true,
    });

    console.log('RabbitMQ conectado');

    return channel;
  },
};
