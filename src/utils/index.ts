import fs from "node:fs/promises";
import readline from "node:readline";
import { appendFile } from "node:fs/promises";
import {
  CONFIG_FILE,
  DEFAULT_CONFIG,
  HOME_DIR,
  PLUGINS_DIR,
} from "../constants";

const DEBUG_LOG_FILE = `${HOME_DIR}/claude-router-debug.log`;

export const writeDebugLog = async (message: string) => {
  try {
    await appendFile(DEBUG_LOG_FILE, `${new Date().toISOString()} - ${message}\n`, 'utf8');
  } catch (error: any) {
    console.error(`Failed to write debug log: ${error.message}`);
  }
};

export const ensureDir = async (dir_path: string) => {
  try {
    await fs.access(dir_path);
  } catch {
    await fs.mkdir(dir_path, { recursive: true });
  }
};

export const initDir = async () => {
  await ensureDir(HOME_DIR);
  await ensureDir(PLUGINS_DIR);
};

const createReadline = () => {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
};

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    const rl = createReadline();
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};

const confirm = async (query: string): Promise<boolean> => {
  const answer = await question(query);
  return answer.toLowerCase() !== "n";
};

export const readConfigFile = async () => {
  try {
    const config = await fs.readFile(CONFIG_FILE, "utf-8");
    const parsedConfig = JSON.parse(config);
    await writeDebugLog(`Successfully parsed config from ${CONFIG_FILE}`);
    return parsedConfig;
  } catch (error: any) {
    await writeDebugLog(`Error reading or parsing config file at ${CONFIG_FILE}: ${error.message}`);
    await writeDebugLog("Prompting for new config due to error or missing file.");
    const name = await question("Enter Provider Name: ");
    const APIKEY = await question("Enter Provider API KEY: ");
    const baseUrl = await question("Enter Provider URL: ");
    const model = await question("Enter MODEL Name: ");
    const config = Object.assign({}, DEFAULT_CONFIG, {
      Providers: [
        {
          name,
          api_base_url: baseUrl,
          api_key: APIKEY,
          models: [model],
        },
      ],
      Router: {
        default: `${name},${model}`,
      },
    });
    await writeConfigFile(config);
    return config;
  }
};

export const writeConfigFile = async (config: any) => {
  await ensureDir(HOME_DIR);
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
};

export const initConfig = async () => {
  const config = await readConfigFile();
  Object.assign(process.env, config);
  return config;
};
