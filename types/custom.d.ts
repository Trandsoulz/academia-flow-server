// declare module 'find-free-port' {
//     /**
//      * Finds free ports starting from the given port.
//      * @param startPort - The port to start searching from.
//      * @param options - Optional configuration for the search.
//      * @param callback - Callback function to handle the result.
//      */
//     function findFreePort(
//         startPort: number,
//         options?: { count?: number; host?: string },
//         callback?: (err: Error | null, freePorts: number | number[]) => void
//     ): void;

import { UserRole } from '../src/models/userModel';

//     export = findFreePort;
// }

// Extend the Request interface to include the user property
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                role: UserRole;
            };
        }
    }
}
