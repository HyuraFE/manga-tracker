import https from "node:https";
import dns from "node:dns";

const MANGADEX_IP = "45.129.229.1";

export function fetchMangaDex(urlStr: string): Promise<{
  status: number;
  headers: Record<string, string | string[] | undefined>;
  buffer: Buffer;
}> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const req = https.get(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        lookup: (hostname, options: any, cb: any) => {
          if (typeof options === "function") {
            cb = options;
            options = {};
          }
          if (hostname.includes("mangadex.org")) {
            if (options && options.all) {
              return cb(null, [{ address: MANGADEX_IP, family: 4 }]);
            }
            return cb(null, MANGADEX_IP, 4);
          }
          dns.lookup(hostname, options, cb);
        },
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "image/avif,image/webp,image/apng,image/svg+xml,image/*,application/json,*/*;q=0.8",
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          resolve({
            status: res.statusCode || 200,
            headers: res.headers,
            buffer: Buffer.concat(chunks),
          });
        });
      }
    );

    req.on("error", reject);
    req.setTimeout(12000, () => {
      req.destroy();
      reject(new Error("MangaDex request timeout"));
    });
  });
}
