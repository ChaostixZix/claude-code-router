import { existsSync, readFileSync, writeFileSync } from 'fs';
import { PID_FILE, REFERENCE_COUNT_FILE } from '../constants';
import { readConfigFile, writeDebugLog } from '.';

export function incrementReferenceCount() {
    let count = 0;
    if (existsSync(REFERENCE_COUNT_FILE)) {
        count = parseInt(readFileSync(REFERENCE_COUNT_FILE, 'utf-8')) || 0;
    }
    count++;
    writeFileSync(REFERENCE_COUNT_FILE, count.toString());
}

export function decrementReferenceCount() {
    let count = 0;
    if (existsSync(REFERENCE_COUNT_FILE)) {
        count = parseInt(readFileSync(REFERENCE_COUNT_FILE, 'utf-8')) || 0;
    }
    count = Math.max(0, count - 1);
    writeFileSync(REFERENCE_COUNT_FILE, count.toString());
}

export function getReferenceCount(): number {
    if (!existsSync(REFERENCE_COUNT_FILE)) {
        return 0;
    }
    return parseInt(readFileSync(REFERENCE_COUNT_FILE, 'utf-8')) || 0;
}

export function isServiceRunning(): boolean {
    writeDebugLog(`Checking if service is running. PID_FILE: ${PID_FILE}`);
    if (!existsSync(PID_FILE)) {
        writeDebugLog(`PID_FILE does not exist. Service is not running.`);
        return false;
    }

    try {
        const pid = parseInt(readFileSync(PID_FILE, 'utf-8'));
        writeDebugLog(`Found PID ${pid} in PID_FILE. Attempting to signal process.`);
        process.kill(pid, 0); // Signal 0 checks if process exists
        writeDebugLog(`Process ${pid} is running.`);
        return true;
    } catch (e: any) {
        writeDebugLog(`Process not running or signal failed for PID in PID_FILE. Error: ${e.message}. Cleaning up PID file.`);
        cleanupPidFile();
        return false;
    }
}

export function savePid(pid: number) {
    writeFileSync(PID_FILE, pid.toString());
}

export function cleanupPidFile() {
    if (existsSync(PID_FILE)) {
        try {
            const fs = require('fs');
            fs.unlinkSync(PID_FILE);
        } catch (e) {
            // Ignore cleanup errors
        }
    }
}

export function getServicePid(): number | null {
    if (!existsSync(PID_FILE)) {
        return null;
    }

    try {
        const pid = parseInt(readFileSync(PID_FILE, 'utf-8'));
        return isNaN(pid) ? null : pid;
    } catch (e) {
        return null;
    }
}

export async function getServiceInfo() {
    const pid = getServicePid();
    const running = isServiceRunning();
    const config = await readConfigFile();

    return {
        running,
        pid,
        port: config.PORT,
        endpoint: `http://127.0.0.1:${config.PORT}`,
        pidFile: PID_FILE,
        referenceCount: getReferenceCount()
    };
}
