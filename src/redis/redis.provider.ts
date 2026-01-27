/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import Redis from 'ioredis';

function getEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Variável de ambiente ${name} não definida`);
  }

  return value;
}

export const RedisProvider = {
  provide: 'REDIS_CLIENT',
  useFactory: () => {
    const host = getEnv('REDIS_HOST');
    const port = Number(getEnv('REDIS_PORT'));

    if (Number.isNaN(port)) {
      throw new Error('REDIS_PORT inválida');
    }

    const client = new Redis({
      host,
      port,
    });

    client.on('connect', () => {
      console.log('Conectado ao Redis');
    });

    client.on('error', (err: unknown) => {
      if (err instanceof Error) {
        console.error('Erro no Redis:', err.message);
      }
    });

    return client;
  },
};

export const RedisSubscriberProvider = {
  provide: 'REDIS_SUBSCRIBER',
  useFactory: (): Redis => {
    return new Redis({
      host: getEnv('REDIS_HOST'),
      port: Number(getEnv('REDIS_PORT')),
    });
  },
};
