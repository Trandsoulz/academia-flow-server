import { connect, MongooseError } from 'mongoose';
import { MONGO_URI } from './envConfig';
import { dbLog } from './loggerConfig';

interface RetryOptions {
    maxRetries: number;
    initialDelay: number;
}

export async function connectToDatabase(
    retryOptions: RetryOptions = { maxRetries: 5, initialDelay: 3000 },
): Promise<void> {
    let attempts = 0;
    const { maxRetries, initialDelay } = retryOptions;

    async function connectWithRetry(): Promise<void> {
        try {
            dbLog.warn(`Attempt ${attempts + 1}: Connecting to database...`);

            if (MONGO_URI) {
                await connect(MONGO_URI);
            } else {
                dbLog.error(
                    'Mongo URI is not defined in environment variables.',
                );
            }
            dbLog.info('Database connection successful!');
        } catch (error) {
            attempts++;
            const typedError = error as MongooseError | Error;
            dbLog.error(
                `Error on attempt ${attempts + 1}: ${typedError.message}`,
            );

            if (attempts < maxRetries) {
                const delay = initialDelay * Math.pow(2, attempts - 1);
                dbLog.warn(`Retrying connection in ${delay / 1000}s...`);
                await new Promise<void>((resolve) =>
                    setTimeout(resolve, delay),
                );

                return connectWithRetry();
            } else {
                dbLog.error(
                    `Max retries has been exceeded. Could not connect to DB. Shutting down now....`,
                );
                process.exit(1);
            }
        }
    }
    await connectWithRetry();
}
