import "dotenv/config";
import { createInterface } from "node:readline";
import { prisma } from "@/lib/prisma";
import argon2 from "argon2";

function ask(prompt: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function askHidden(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });

    // Mute output while typing the password
    process.stdout.write(prompt);
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw ?? false;

    if (typeof stdin.setRawMode === "function") {
      stdin.setRawMode(true);
    }

    let password = "";

    const onData = (ch: Buffer) => {
      const char = ch.toString("utf8");

      if (char === "\n" || char === "\r" || char === "\u0004") {
        // Enter or Ctrl-D
        if (typeof stdin.setRawMode === "function") {
          stdin.setRawMode(wasRaw);
        }
        stdin.removeListener("data", onData);
        process.stdout.write("\n");
        rl.close();
        resolve(password.trim());
      } else if (char === "\u0003") {
        // Ctrl-C
        process.exit(130);
      } else if (char === "\u007F" || char === "\b") {
        // Backspace
        password = password.slice(0, -1);
      } else {
        password += char;
      }
    };

    stdin.on("data", onData);
    stdin.resume();
  });
}

async function main() {
  const existing = await prisma.adminUser.count();
  if (existing > 0) {
    console.error("An admin account already exists. Refusing to create another.");
    process.exit(1);
  }

  const username = await ask("Admin username: ");
  if (!username) {
    console.error("Username cannot be empty.");
    process.exit(1);
  }

  const password = await askHidden("Admin password: ");
  if (!password) {
    console.error("Password cannot be empty.");
    process.exit(1);
  }
  if (password.length < 12) {
    console.error("Password must be at least 12 characters.");
    process.exit(1);
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  await prisma.adminUser.create({
    data: { username, passwordHash },
  });

  console.log(`Admin account created: ${username}`);
}

main()
  .catch((err) => {
    console.error("Error:", err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
